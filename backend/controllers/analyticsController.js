const mongoose = require('mongoose');
const Card = require('../models/Card');
const Column = require('../models/Column');
const Board = require('../models/Board');
const TimeLog = require('../models/TimeLog');

const getBurndownAnalytics = async (req, res, next) => {
  try {
    const { boardId } = req.query;
    if (!boardId) {
      return res.status(400).json({ success: false, message: 'Board ID is required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // 1. Fetch Done columns in the board
    const doneColumns = await Column.find({ boardId, name: /Done/i, isArchived: false });
    const doneColumnIds = doneColumns.map(c => c._id);

    // 2. Aggregate story points completed vs remaining
    const cardStats = await Card.aggregate([
      { $match: { boardId: new mongoose.Types.ObjectId(boardId), isArchived: false } },
      {
        $group: {
          _id: null,
          totalCards: { $sum: 1 },
          completedCards: {
            $sum: { $cond: [{ $in: ['$columnId', doneColumnIds] }, 1, 0] }
          },
          totalStoryPoints: { $sum: '$storyPoints' },
          completedStoryPoints: {
            $sum: { $cond: [{ $in: ['$columnId', doneColumnIds] }, '$storyPoints', 0] }
          }
        }
      }
    ]);

    const stats = cardStats[0] || {
      totalCards: 0,
      completedCards: 0,
      totalStoryPoints: 0,
      completedStoryPoints: 0
    };

    const remainingCards = stats.totalCards - stats.completedCards;
    const remainingStoryPoints = stats.totalStoryPoints - stats.completedStoryPoints;
    const completionPercentage = stats.totalCards > 0 ? Math.round((stats.completedCards / stats.totalCards) * 100) : 0;

    // 3. Aggregate closed tasks per day (using last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const closedTasksPerDay = await Card.aggregate([
      {
        $match: {
          boardId: new mongoose.Types.ObjectId(boardId),
          columnId: { $in: doneColumnIds },
          isArchived: false,
          updatedAt: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          count: { $sum: 1 },
          storyPoints: { $sum: '$storyPoints' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Team Velocity (Average story points completed per week over past 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const weeklyVelocity = await Card.aggregate([
      {
        $match: {
          boardId: new mongoose.Types.ObjectId(boardId),
          columnId: { $in: doneColumnIds },
          isArchived: false,
          updatedAt: { $gte: fourWeeksAgo }
        }
      },
      {
        $group: {
          _id: { $week: '$updatedAt' },
          storyPoints: { $sum: '$storyPoints' }
        }
      }
    ]);

    const velocityTotal = weeklyVelocity.reduce((sum, w) => sum + w.storyPoints, 0);
    const teamVelocity = weeklyVelocity.length > 0 ? Math.round(velocityTotal / weeklyVelocity.length) : 0;

    res.status(200).json({
      success: true,
      burndown: {
        totalCards: stats.totalCards,
        completedCards: stats.completedCards,
        remainingCards,
        totalStoryPoints: stats.totalStoryPoints,
        completedStoryPoints: stats.completedStoryPoints,
        remainingStoryPoints,
        completionPercentage,
        teamVelocity,
        closedTasksPerDay: closedTasksPerDay.map(item => ({
          date: item._id,
          count: item.count,
          storyPoints: item.storyPoints
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTimeTrackingAnalytics = async (req, res, next) => {
  try {
    const { boardId } = req.query;
    if (!boardId) {
      return res.status(400).json({ success: false, message: 'Board ID is required' });
    }

    // Retrieve all active cards on the board
    const cards = await Card.find({ boardId, isArchived: false });
    const cardIds = cards.map(c => c._id);

    // 1. Daily Time logged in the last 7 days (seconds)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyLogs = await TimeLog.aggregate([
      {
        $match: {
          cardId: { $in: cardIds },
          endTime: { $ne: null },
          startTime: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Weekly Time logged in last 4 weeks
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const weeklyLogs = await TimeLog.aggregate([
      {
        $match: {
          cardId: { $in: cardIds },
          endTime: { $ne: null },
          startTime: { $gte: fourWeeksAgo }
        }
      },
      {
        $group: {
          _id: { $week: '$startTime' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Monthly Time logged in the current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const monthlyLogs = await TimeLog.aggregate([
      {
        $match: {
          cardId: { $in: cardIds },
          endTime: { $ne: null },
          startTime: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$startTime' },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      timeTracking: {
        daily: dailyLogs.map(item => ({
          date: item._id,
          hours: Math.round((item.totalDuration / 3600) * 100) / 100 // convert to hours
        })),
        weekly: weeklyLogs.map(item => ({
          week: `Week ${item._id}`,
          hours: Math.round((item.totalDuration / 3600) * 100) / 100
        })),
        monthly: monthlyLogs.map(item => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return {
            month: monthNames[item._id - 1] || `Month ${item._id}`,
            hours: Math.round((item.totalDuration / 3600) * 100) / 100
          };
        })
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBurndownAnalytics,
  getTimeTrackingAnalytics
};

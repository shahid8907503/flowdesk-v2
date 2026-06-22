const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const { logAction } = require('../services/auditService');
const { boardSchema } = require('../utils/validators');

const TimeLog = require('../models/TimeLog');

const createBoard = async (req, res, next) => {
  try {
    const parsedData = boardSchema.parse(req.body);
    const { workspaceId, name, description, color } = parsedData;

    const board = await Board.create({
      workspaceId,
      name,
      description,
      color: color || '#4f46e5'
    });

    // Automatically create the 5 standard Columns for a new Board
    const defaultColumnNames = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
    const columns = [];
    for (let i = 0; i < defaultColumnNames.length; i++) {
      const col = await Column.create({
        boardId: board._id,
        name: defaultColumnNames[i],
        position: i
      });
      columns.push(col);
    }

    await logAction(req.user._id, 'board.create', req, { boardId: board._id, name });

    res.status(201).json({
      success: true,
      board: {
        ...board._doc,
        columns
      }
    });
  } catch (error) {
    next(error);
  }
};

const getBoards = async (req, res, next) => {
  try {
    const { workspaceId } = req.query;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    const boards = await Board.find({ workspaceId, isArchived: false });
    res.status(200).json({
      success: true,
      boards
    });
  } catch (error) {
    next(error);
  }
};

const getBoardById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // Fetch active columns
    const columns = await Column.find({ boardId: board._id, isArchived: false }).sort({ position: 1 });
    const colIds = columns.map(c => c._id);

    // Fetch active cards and sort by position
    const cards = await Card.find({ columnId: { $in: colIds }, isArchived: false })
      .populate('assignees', 'name email avatar')
      .sort({ position: 1 });

    // Fetch time logs for these cards to calculate durations
    const cardIds = cards.map(c => c._id);
    const logs = await TimeLog.find({ cardId: { $in: cardIds } });

    const cardsWithTime = cards.map(card => {
      const cardLogs = logs.filter(l => l.cardId.toString() === card._id.toString());
      const totalDuration = cardLogs.filter(l => l.endTime).reduce((sum, l) => sum + (l.duration || 0), 0);
      const isTimerRunning = cardLogs.some(l => !l.endTime);
      return {
        ...card._doc,
        totalDuration,
        isTimerRunning
      };
    });

    // Nest cards inside their respective columns
    const columnsWithCards = columns.map(col => {
      return {
        ...col._doc,
        cards: cardsWithTime.filter(card => card.columnId.toString() === col._id.toString())
      };
    });

    res.status(200).json({
      success: true,
      board,
      columns: columnsWithCards
    });
  } catch (error) {
    next(error);
  }
};

const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, isArchived } = req.body;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    if (name) board.name = name;
    if (description !== undefined) board.description = description;
    if (color) board.color = color;
    if (isArchived !== undefined) board.isArchived = isArchived;

    await board.save();

    await logAction(req.user._id, 'board.update', req, { boardId: board._id, name: board.name });

    res.status(200).json({
      success: true,
      board
    });
  } catch (error) {
    next(error);
  }
};

const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Instead of destructive deletion, we soft delete/archive it
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    board.isArchived = true;
    await board.save();

    await logAction(req.user._id, 'board.archive', req, { boardId: board._id });

    res.status(200).json({
      success: true,
      message: 'Board archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard
};

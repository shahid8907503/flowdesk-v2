const express = require('express');
const { generateSubtasks, generateSprintPlan } = require('../services/aiService');
const Card = require('../models/Card');
const Board = require('../models/Board');
const Column = require('../models/Column');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const logger = require('../config/logger');

const router = express.Router();

router.use(protect);

/**
 * @desc Generate subtasks for a card
 * @route POST /api/ai/generate-subtasks
 */
router.post('/generate-subtasks', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), async (req, res, next) => {
  try {
    const { cardId, title, description } = req.body;
    
    let taskTitle = title;
    let taskDesc = description;

    if (cardId) {
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({ success: false, message: 'Card not found' });
      }
      taskTitle = card.title;
      taskDesc = card.description;
    }

    if (!taskTitle) {
      return res.status(400).json({ success: false, message: 'Task Title is required' });
    }

    const subtasks = await generateSubtasks(taskTitle, taskDesc);
    res.status(200).json({
      success: true,
      subtasks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc Generate sprint plan suggestions for a board
 * @route POST /api/ai/sprint-plan
 */
router.post('/sprint-plan', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), async (req, res, next) => {
  try {
    const { boardId } = req.body;
    if (!boardId) {
      return res.status(400).json({ success: false, message: 'Board ID is required' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    // Load active cards with assignees info
    const cards = await Card.find({ boardId, isArchived: false })
      .populate('assignees', 'name email');

    const sprintPlan = await generateSprintPlan(board.name, cards);
    res.status(200).json({
      success: true,
      sprintPlan
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

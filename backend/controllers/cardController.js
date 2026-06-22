const mongoose = require('mongoose');
const Card = require('../models/Card');
const Column = require('../models/Column');
const Board = require('../models/Board');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const TimeLog = require('../models/TimeLog');
const { getIO } = require('../config/socket');
const { triggerWebhook } = require('../services/webhookService');
const { logAction } = require('../services/auditService');
const { cardSchema, moveCardSchema } = require('../utils/validators');
const logger = require('../config/logger');

// Helper to broadcast socket events
const broadcastBoardUpdate = (boardId, eventType, data) => {
  try {
    const io = getIO();
    io.to(`board:${boardId}`).emit('board_change', { type: eventType, data });
  } catch (error) {
    // Sockets might not be initialized in non-server contexts (e.g. CLI tests)
  }
};

const createCard = async (req, res, next) => {
  try {
    const parsedData = cardSchema.parse(req.body);
    
    // Check if column exists
    const column = await Column.findById(parsedData.columnId);
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }

    // Get count of cards in column for setting default position
    const cardCount = await Card.countDocuments({ columnId: parsedData.columnId, isArchived: false });

    const card = await Card.create({
      ...parsedData,
      position: parsedData.position ?? cardCount
    });

    // Populate assignees for frontend convenience
    await card.populate('assignees', 'name email avatar');

    await logAction(req.user._id, 'card.create', req, { cardId: card._id, title: card.title });
    broadcastBoardUpdate(card.boardId, 'card.create', card);

    res.status(201).json({
      success: true,
      card
    });
  } catch (error) {
    next(error);
  }
};

const getCards = async (req, res, next) => {
  try {
    const { boardId } = req.query;
    if (!boardId) {
      return res.status(400).json({ success: false, message: 'Board ID is required' });
    }

    const cards = await Card.find({ boardId, isArchived: false })
      .populate('assignees', 'name email avatar')
      .sort({ position: 1 });

    res.status(200).json({
      success: true,
      cards
    });
  } catch (error) {
    next(error);
  }
};

const getCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const card = await Card.findById(id)
      .populate('assignees', 'name email avatar')
      .populate('boardId');
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    // Fetch time logs and comments
    const comments = await Comment.find({ cardId: card._id }).populate('userId', 'name email avatar').sort({ createdAt: -1 });
    const attachments = await Attachment.find({ cardId: card._id }).populate('uploadedBy', 'name email avatar');
    const timeLogs = await TimeLog.find({ cardId: card._id }).populate('userId', 'name email avatar').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      card,
      comments,
      attachments,
      timeLogs
    });
  } catch (error) {
    next(error);
  }
};

const updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    // Capture changes for logs
    const changes = {};
    for (const key in updates) {
      if (updates[key] !== undefined && key !== '_id') {
        card[key] = updates[key];
        changes[key] = updates[key];
      }
    }

    await card.save();
    await card.populate('assignees', 'name email avatar');

    await logAction(req.user._id, 'card.update', req, { cardId: card._id, changes });
    broadcastBoardUpdate(card.boardId, 'card.update', card);

    res.status(200).json({
      success: true,
      card
    });
  } catch (error) {
    next(error);
  }
};

const moveCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsedData = moveCardSchema.parse(req.body);
    const { columnId, position } = parsedData;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    const sourceColumnId = card.columnId;
    const targetColumn = await Column.findById(columnId);
    if (!targetColumn) {
      return res.status(404).json({ success: false, message: 'Target column not found' });
    }

    // Check if target column is the 'Done' column to trigger webhook
    const isDoneColumn = targetColumn.name.toLowerCase() === 'done';

    // Retrieve board details for workspace ID
    const board = await Board.findById(card.boardId);

    // Reorder cards in source column
    await Card.updateMany(
      { columnId: sourceColumnId, position: { $gt: card.position }, isArchived: false },
      { $inc: { position: -1 } }
    );

    // Reorder cards in target column to accommodate the new card
    await Card.updateMany(
      { columnId, position: { $gte: position }, isArchived: false },
      { $inc: { position: 1 } }
    );

    card.columnId = columnId;
    card.position = position;
    await card.save();
    await card.populate('assignees', 'name email avatar');

    await logAction(req.user._id, 'card.move', req, {
      cardId: card._id,
      fromColumn: sourceColumnId,
      toColumn: columnId,
      position
    });

    broadcastBoardUpdate(card.boardId, 'card.move', {
      cardId: card._id,
      fromColumn: sourceColumnId,
      toColumn: columnId,
      position,
      card
    });

    // Webhook invocation
    if (isDoneColumn && board) {
      const webhookPayload = {
        cardId: card._id,
        cardTitle: card.title,
        workspaceId: board.workspaceId,
        userId: req.user._id,
        timestamp: new Date().toISOString()
      };
      triggerWebhook(board.workspaceId, 'card.done', webhookPayload);
    }

    res.status(200).json({
      success: true,
      card
    });
  } catch (error) {
    next(error);
  }
};

const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ success: false, message: 'Card not found' });
    }

    card.isArchived = true;
    await card.save();

    await logAction(req.user._id, 'card.delete', req, { cardId: card._id });
    broadcastBoardUpdate(card.boardId, 'card.delete', { cardId: card._id });

    res.status(200).json({
      success: true,
      message: 'Card archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Time Tracking
const startTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check for running timer
    const activeLog = await TimeLog.findOne({ cardId: id, userId: req.user._id, endTime: null });
    if (activeLog) {
      return res.status(400).json({ success: false, message: 'Timer is already running for this card' });
    }

    const log = await TimeLog.create({
      cardId: id,
      userId: req.user._id,
      startTime: new Date()
    });

    await logAction(req.user._id, 'timer.start', req, { cardId: id, logId: log._id });
    broadcastBoardUpdate(req.body.boardId || id, 'timer.start', { cardId: id, userId: req.user._id });

    res.status(200).json({
      success: true,
      log
    });
  } catch (error) {
    next(error);
  }
};

const stopTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const activeLog = await TimeLog.findOne({ cardId: id, userId: req.user._id, endTime: null });
    if (!activeLog) {
      return res.status(400).json({ success: false, message: 'No active timer found for this card' });
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - activeLog.startTime.getTime()) / 1000); // duration in seconds

    activeLog.endTime = endTime;
    activeLog.duration = duration;
    await activeLog.save();

    await logAction(req.user._id, 'timer.stop', req, { cardId: id, duration });
    broadcastBoardUpdate(req.body.boardId || id, 'timer.stop', { cardId: id, userId: req.user._id, duration });

    res.status(200).json({
      success: true,
      log: activeLog
    });
  } catch (error) {
    next(error);
  }
};

// Comments
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty' });
    }

    const comment = await Comment.create({
      cardId: id,
      userId: req.user._id,
      text
    });

    await comment.populate('userId', 'name email avatar');

    await logAction(req.user._id, 'comment.add', req, { cardId: id, commentId: comment._id });
    
    // Fetch boardId from card
    const card = await Card.findById(id);
    if (card) {
      broadcastBoardUpdate(card.boardId, 'comment.add', comment);
    }

    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    next(error);
  }
};

// Attachments (Mock uploads saving reference in DB)
const addAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Capture Cloudinary URL or local server static path
    let fileUrl = req.file.path;
    if (!req.file.path.startsWith('http')) {
      const backendUrl = `${req.protocol}://${req.get('host')}`;
      fileUrl = `${backendUrl}/uploads/${req.file.filename}`;
    }

    const attachment = await Attachment.create({
      cardId: id,
      filename: req.file.originalname,
      url: fileUrl,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    });

    await attachment.populate('uploadedBy', 'name email avatar');

    await logAction(req.user._id, 'attachment.add', req, { cardId: id, filename: req.file.originalname });

    const card = await Card.findById(id);
    if (card) {
      broadcastBoardUpdate(card.boardId, 'attachment.add', attachment);
    }

    res.status(201).json({
      success: true,
      attachment
    });
  } catch (error) {
    next(error);
  }
};

// Bulk Card Move Transaction
// Atomic relocation of up to 500 cards with Session transaction support
const bulkMove = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cardIds, targetColumnId, targetBoardId } = req.body;

    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of cardIds is required' });
    }

    if (!targetColumnId || !targetBoardId) {
      return res.status(400).json({ success: false, message: 'Target Board ID and Column ID are required' });
    }

    // Verify target column exists
    const column = await Column.findById(targetColumnId).session(session);
    if (!column) {
      throw new Error('Target column not found');
    }

    // Verify target board exists
    const board = await Board.findById(targetBoardId).session(session);
    if (!board) {
      throw new Error('Target board not found');
    }

    // Get current card count in target column to append positions
    const initialPosition = await Card.countDocuments({ columnId: targetColumnId, isArchived: false }).session(session);

    let offset = 0;
    for (const cardId of cardIds) {
      const card = await Card.findById(cardId).session(session);
      if (!card) {
        throw new Error(`Card with ID ${cardId} not found`);
      }

      // Reorder cards in source column
      await Card.updateMany(
        { columnId: card.columnId, position: { $gt: card.position }, isArchived: false },
        { $inc: { position: -1 } }
      ).session(session);

      card.boardId = targetBoardId;
      card.columnId = targetColumnId;
      card.position = initialPosition + offset;
      await card.save({ session });

      offset++;
    }

    // Commit Transaction
    await session.commitTransaction();
    session.endSession();

    await logAction(req.user._id, 'card.bulk_move', req, {
      cardCount: cardIds.length,
      targetBoardId,
      targetColumnId
    });

    // Notify via sockets
    broadcastBoardUpdate(targetBoardId, 'card.bulk_move', { cardIds, targetColumnId });

    res.status(200).json({
      success: true,
      message: `Successfully moved ${cardIds.length} cards in a transaction.`
    });
  } catch (error) {
    // Abort Transaction on failure
    await session.abortTransaction();
    session.endSession();
    logger.error('Bulk card move transaction aborted. Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Bulk card move transaction failed and rolled back.',
      error: error.message
    });
  }
};

module.exports = {
  createCard,
  getCards,
  getCardById,
  updateCard,
  moveCard,
  deleteCard,
  startTimer,
  stopTimer,
  addComment,
  addAttachment,
  bulkMove
};

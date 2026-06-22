const Column = require('../models/Column');
const { logAction } = require('../services/auditService');
const { columnSchema } = require('../utils/validators');

const createColumn = async (req, res, next) => {
  try {
    const parsedData = columnSchema.parse(req.body);
    const { boardId, name, position } = parsedData;

    const column = await Column.create({
      boardId,
      name,
      position
    });

    await logAction(req.user._id, 'column.create', req, { columnId: column._id, name });

    res.status(201).json({
      success: true,
      column
    });
  } catch (error) {
    next(error);
  }
};

const updateColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, isArchived } = req.body;

    const column = await Column.findById(id);
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }

    if (name) column.name = name;
    if (position !== undefined) column.position = position;
    if (isArchived !== undefined) column.isArchived = isArchived;

    await column.save();

    await logAction(req.user._id, 'column.update', req, { columnId: column._id, name: column.name });

    res.status(200).json({
      success: true,
      column
    });
  } catch (error) {
    next(error);
  }
};

const deleteColumn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const column = await Column.findById(id);
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found' });
    }

    column.isArchived = true;
    await column.save();

    await logAction(req.user._id, 'column.archive', req, { columnId: column._id });

    res.status(200).json({
      success: true,
      message: 'Column archived successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createColumn,
  updateColumn,
  deleteColumn
};

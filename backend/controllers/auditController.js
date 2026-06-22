const AuditLog = require('../models/AuditLog');

const getAuditLogs = async (req, res, next) => {
  try {
    const { workspaceId, action, userId, limit = 50, page = 1 } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required' });
    }

    // Build filter
    const filter = {
      $or: [
        { 'details.workspaceId': workspaceId },
        { 'details.workspaceId': new RegExp(workspaceId, 'i') } // String comparison check
      ]
    };

    if (action) {
      filter.action = action;
    }

    if (userId) {
      filter.userId = userId;
    }

    const totalLogs = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total: totalLogs,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAuditLogs };

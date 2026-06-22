const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

const logAction = async (userId, action, req = null, details = {}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress) : 'system';
    const userAgent = req ? req.headers['user-agent'] : 'system';

    const auditRecord = await AuditLog.create({
      userId,
      action,
      ipAddress,
      userAgent,
      details
    });

    logger.debug(`Audit log created: ${action} by user ${userId}`);
    return auditRecord;
  } catch (error) {
    logger.error('Failed to write audit log:', error);
  }
};

module.exports = { logAction };

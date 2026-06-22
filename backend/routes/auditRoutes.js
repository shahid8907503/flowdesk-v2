const express = require('express');
const { getAuditLogs } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.get('/', checkRole(['Super Admin', 'Workspace Admin']), getAuditLogs);

module.exports = router;

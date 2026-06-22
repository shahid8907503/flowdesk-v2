const express = require('express');
const {
  getBurndownAnalytics,
  getTimeTrackingAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.get('/burndown', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getBurndownAnalytics);
router.get('/time-tracking', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getTimeTrackingAnalytics);

module.exports = router;

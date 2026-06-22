const express = require('express');
const {
  createWebhook,
  getWebhooks,
  deleteWebhook
} = require('../controllers/webhookController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.post('/', checkRole(['Super Admin', 'Workspace Admin']), createWebhook);
router.get('/', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getWebhooks);
router.delete('/:id', checkRole(['Super Admin', 'Workspace Admin']), deleteWebhook);

module.exports = router;

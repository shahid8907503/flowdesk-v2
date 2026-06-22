const express = require('express');
const {
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
} = require('../controllers/cardController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

// Bulk operations
router.post('/bulk-move', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), bulkMove);

// Standard card endpoints
router.post('/', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), createCard);
router.get('/', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getCards);
router.get('/:id', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getCardById);
router.put('/:id', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), updateCard);
router.put('/:id/move', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), moveCard);
router.delete('/:id', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), deleteCard);

// Timer endpoints
router.post('/:id/start-timer', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), startTimer);
router.post('/:id/stop-timer', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), stopTimer);

// Nested resource posts
router.post('/:id/comments', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), addComment);
router.post('/:id/attachments', checkRole(['Super Admin', 'Workspace Admin', 'Editor']), upload.single('file'), addAttachment);

module.exports = router;

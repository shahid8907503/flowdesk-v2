const express = require('express');
const {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard
} = require('../controllers/boardController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.post('/', checkRole(['Super Admin', 'Workspace Admin']), createBoard);
router.get('/', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getBoards);
router.get('/:id', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getBoardById);
router.put('/:id', checkRole(['Super Admin', 'Workspace Admin']), updateBoard);
router.delete('/:id', checkRole(['Super Admin', 'Workspace Admin']), deleteBoard);

module.exports = router;

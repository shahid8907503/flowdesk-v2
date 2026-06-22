const express = require('express');
const {
  createColumn,
  updateColumn,
  deleteColumn
} = require('../controllers/columnController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.post('/', checkRole(['Super Admin', 'Workspace Admin']), createColumn);
router.put('/:id', checkRole(['Super Admin', 'Workspace Admin']), updateColumn);
router.delete('/:id', checkRole(['Super Admin', 'Workspace Admin']), deleteColumn);

module.exports = router;

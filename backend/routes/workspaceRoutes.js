const express = require('express');
const {
  createWorkspace,
  getWorkspaces,
  inviteMember,
  getMembers,
  updateMemberRole,
  removeMember,
  deleteWorkspace
} = require('../controllers/workspaceController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);

// Member routes inside workspaces with roles checks
router.post('/:workspaceId/invite', checkRole(['Super Admin', 'Workspace Admin']), inviteMember);
router.get('/:workspaceId/members', checkRole(['Super Admin', 'Workspace Admin', 'Editor', 'Viewer']), getMembers);
router.put('/:workspaceId/members/:memberUserId', checkRole(['Super Admin', 'Workspace Admin']), updateMemberRole);
router.delete('/:workspaceId/members/:memberUserId', checkRole(['Super Admin', 'Workspace Admin']), removeMember);
router.delete('/:workspaceId', deleteWorkspace);

module.exports = router;

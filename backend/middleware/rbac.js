const WorkspaceMember = require('../models/WorkspaceMember');
const Board = require('../models/Board');
const Card = require('../models/Card');
const Column = require('../models/Column');

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      let workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

      // 1. Resolve workspace from Board ID if not directly provided
      if (!workspaceId) {
        const boardId = req.params.boardId || req.body.boardId || req.body.targetBoardId || req.query.boardId || (req.baseUrl.includes('boards') ? req.params.id : null);
        if (boardId && boardId.match(/^[0-9a-fA-F]{24}$/)) {
          const board = await Board.findById(boardId);
          if (board) {
            workspaceId = board.workspaceId;
          }
        }
      }

      // 2. Resolve workspace from Card ID if not directly provided
      if (!workspaceId) {
        const cardId = req.params.cardId || (req.baseUrl.includes('cards') ? req.params.id : null) || req.body.cardId;
        if (cardId && cardId.match(/^[0-9a-fA-F]{24}$/)) { // Verify ObjectID format
          const card = await Card.findById(cardId);
          if (card) {
            const board = await Board.findById(card.boardId);
            if (board) {
              workspaceId = board.workspaceId;
            }
          }
        }
      }

      // 3. Resolve workspace from Column ID if not directly provided
      if (!workspaceId) {
        const columnId = req.params.columnId || req.body.columnId || req.query.columnId || (req.baseUrl.includes('columns') ? req.params.id : null);
        if (columnId && columnId.match(/^[0-9a-fA-F]{24}$/)) {
          const column = await Column.findById(columnId);
          if (column) {
            const board = await Board.findById(column.boardId);
            if (board) {
              workspaceId = board.workspaceId;
            }
          }
        }
      }

      if (!workspaceId) {
        return res.status(400).json({
          success: false,
          message: 'Workspace context is required for authorization.'
        });
      }

      // Find the user's membership details
      const member = await WorkspaceMember.findOne({
        workspaceId,
        userId: req.user._id
      });

      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not a member of this workspace.'
        });
      }

      req.workspaceMember = member;

      // Normalize role for database compatibility (mapping lowercase 'admin', 'editor', 'viewer')
      let userRole = member.role;
      if (userRole === 'admin') userRole = 'Workspace Admin';
      if (userRole === 'editor') userRole = 'Editor';
      if (userRole === 'viewer') userRole = 'Viewer';

      // Allow access if user's role is allowed
      if (allowedRoles.includes(userRole) || allowedRoles.includes(member.role)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: `Access denied: Required permission level not met. Allowed roles: ${allowedRoles.join(', ')}`
      });
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { checkRole };

const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const User = require('../models/User');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const TimeLog = require('../models/TimeLog');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const { logAction } = require('../services/auditService');
const { workspaceSchema } = require('../utils/validators');

const createWorkspace = async (req, res, next) => {
  try {
    const parsedData = workspaceSchema.parse(req.body);
    const { name, description } = parsedData;

    // Generate unique slug
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Workspace.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const workspace = await Workspace.create({
      name,
      slug,
      description,
      owner: req.user._id
    });

    // Create membership for the creator as Workspace Admin
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: req.user._id,
      role: 'Workspace Admin'
    });

    await logAction(req.user._id, 'workspace.create', req, { workspaceId: workspace._id, name });

    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    next(error);
  }
};

const getWorkspaces = async (req, res, next) => {
  try {
    // Find all memberships of user
    const memberships = await WorkspaceMember.find({ userId: req.user._id }).populate({
      path: 'workspaceId',
      populate: { path: 'owner', select: 'name email avatar' }
    });

    const workspaces = memberships
      .map(m => {
        if (!m.workspaceId) return null;
        return {
          ...m.workspaceId._doc,
          myRole: m.role
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      workspaces
    });
  } catch (error) {
    next(error);
  }
};

const inviteMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already a member
    const existingMember = await WorkspaceMember.findOne({ workspaceId, userId: targetUser._id });
    if (existingMember) {
      return res.status(400).json({ success: false, message: 'User is already a member of this workspace' });
    }

    const newMember = await WorkspaceMember.create({
      workspaceId,
      userId: targetUser._id,
      role: role || 'Editor'
    });

    await logAction(req.user._id, 'workspace.invite_member', req, { workspaceId, targetUserId: targetUser._id, role });

    res.status(201).json({
      success: true,
      message: 'Member invited successfully',
      member: {
        id: newMember._id,
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          avatar: targetUser.avatar
        },
        role: newMember.role
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMembers = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const members = await WorkspaceMember.find({ workspaceId }).populate('userId', 'name email avatar');

    res.status(200).json({
      success: true,
      members: members.map(m => ({
        id: m._id,
        user: {
          id: m.userId._id,
          name: m.userId.name,
          email: m.userId.email,
          avatar: m.userId.avatar
        },
        role: m.role
      }))
    });
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { workspaceId, memberUserId } = req.params;
    const { role } = req.body;

    if (!['Workspace Admin', 'Editor', 'Viewer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const membership = await WorkspaceMember.findOne({ workspaceId, userId: memberUserId });
    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership not found' });
    }

    // Don't let user demote workspace owner
    const workspace = await Workspace.findById(workspaceId);
    if (workspace.owner.toString() === memberUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change the role of the workspace owner' });
    }

    membership.role = role;
    await membership.save();

    await logAction(req.user._id, 'workspace.update_member_role', req, { workspaceId, targetUserId: memberUserId, role });

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      membership
    });
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { workspaceId, memberUserId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (workspace.owner.toString() === memberUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove the workspace owner' });
    }

    const result = await WorkspaceMember.deleteOne({ workspaceId, userId: memberUserId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    await logAction(req.user._id, 'workspace.remove_member', req, { workspaceId, targetUserId: memberUserId });

    res.status(200).json({
      success: true,
      message: 'Member removed from workspace'
    });
  } catch (error) {
    next(error);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: 'Workspace not found' });
    }

    // Only the workspace owner can delete the workspace
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the workspace owner can delete it' });
    }

    // 1. Find all boards in this workspace
    const boards = await Board.find({ workspaceId });
    const boardIds = boards.map(b => b._id);

    // 2. Find columns in these boards
    const columns = await Column.find({ boardId: { $in: boardIds } });
    const columnIds = columns.map(c => c._id);

    // 3. Find cards in these columns
    const cards = await Card.find({ columnId: { $in: columnIds } });
    const cardIds = cards.map(c => c._id);

    // Cascading deletes
    await Workspace.deleteOne({ _id: workspaceId });
    await WorkspaceMember.deleteMany({ workspaceId });
    await Board.deleteMany({ workspaceId });
    await Column.deleteMany({ boardId: { $in: boardIds } });
    await Card.deleteMany({ columnId: { $in: columnIds } });
    await TimeLog.deleteMany({ cardId: { $in: cardIds } });
    await Comment.deleteMany({ cardId: { $in: cardIds } });
    await Attachment.deleteMany({ cardId: { $in: cardIds } });

    await logAction(req.user._id, 'workspace.delete', req, { workspaceId, name: workspace.name });

    res.status(200).json({
      success: true,
      message: 'Workspace and all its associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  inviteMember,
  getMembers,
  updateMemberRole,
  removeMember,
  deleteWorkspace
};

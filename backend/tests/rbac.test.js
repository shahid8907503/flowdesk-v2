const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const Board = require('../models/Board');
const Column = require('../models/Column');

const TEST_MONGO_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/flowdesk_test';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_123';

let adminToken, editorToken, viewerToken;
let workspaceId, boardId, columnId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }

  // Create Users
  const admin = await User.create({ name: 'Admin', email: 'admin@work.com', password: 'password', isVerified: true });
  const editor = await User.create({ name: 'Editor', email: 'editor@work.com', password: 'password', isVerified: true });
  const viewer = await User.create({ name: 'Viewer', email: 'viewer@work.com', password: 'password', isVerified: true });

  adminToken = jwt.sign({ userId: admin._id }, ACCESS_SECRET);
  editorToken = jwt.sign({ userId: editor._id }, ACCESS_SECRET);
  viewerToken = jwt.sign({ userId: viewer._id }, ACCESS_SECRET);

  // Create Workspace owned by Admin
  const workspace = await Workspace.create({ name: 'Dev Workspace', slug: 'dev-workspace', owner: admin._id });
  workspaceId = workspace._id;

  // Set Workspace Memberships
  await WorkspaceMember.create([
    { workspaceId, userId: admin._id, role: 'Workspace Admin' },
    { workspaceId, userId: editor._id, role: 'Editor' },
    { workspaceId, userId: viewer._id, role: 'Viewer' }
  ]);

  // Create Board (automatically creates columns in controller, but we create board + column directly here for manual setup)
  const board = await Board.create({ workspaceId, name: 'Main Sprint Board' });
  boardId = board._id;

  const col = await Column.create({ boardId, name: 'To Do', position: 0 });
  columnId = col._id;
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

describe('RBAC Middleware Authorizations', () => {
  describe('Workspace Admin Roles', () => {
    it('should allow Workspace Admin to create a new board', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          workspaceId: workspaceId.toString(),
          name: 'Admin Board',
          description: 'A board created by admin'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
    });

    it('should allow Workspace Admin to edit a column', async () => {
      const res = await request(app)
        .put(`/api/columns/${columnId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Sprint Backlog' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Editor Roles', () => {
    it('should block Editor from creating a Board', async () => {
      const res = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          workspaceId: workspaceId.toString(),
          name: 'Editor Board'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow Editor to create a Card', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({
          columnId: columnId.toString(),
          boardId: boardId.toString(),
          title: 'Editor Task'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Viewer Roles', () => {
    it('should block Viewer from creating a Card', async () => {
      const res = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          columnId: columnId.toString(),
          boardId: boardId.toString(),
          title: 'Viewer Task'
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow Viewer to retrieve cards', async () => {
      const res = await request(app)
        .get(`/api/cards?boardId=${boardId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send();

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});

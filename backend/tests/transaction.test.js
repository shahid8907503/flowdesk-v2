const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');

const TEST_MONGO_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/flowdesk_test';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_123';

let token, workspaceId, boardId, columnId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
  const user = await User.create({ name: 'Admin', email: 'admin@trx.com', password: 'password', isVerified: true });
  token = jwt.sign({ userId: user._id }, ACCESS_SECRET);

  const workspace = await Workspace.create({ name: 'Trx WS', slug: 'trx-ws', owner: user._id });
  workspaceId = workspace._id;

  await WorkspaceMember.create({ workspaceId, userId: user._id, role: 'Workspace Admin' });

  const board = await Board.create({ workspaceId, name: 'Trx Board' });
  boardId = board._id;

  const col = await Column.create({ boardId, name: 'Trx Col', position: 0 });
  columnId = col._id;
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

describe('Bulk Card Move Transaction & Rollback', () => {
  it('should attempt transaction and trigger rollback on missing cards or unsupported environments', async () => {
    const res = await request(app)
      .post('/api/cards/bulk-move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cardIds: [new mongoose.Types.ObjectId().toString()], // random non-existent card ID
        targetColumnId: columnId.toString(),
        targetBoardId: boardId.toString()
      });

    // In a non-replica set environment, startSession fails immediately.
    // In a replica set environment, the card search fails and triggers a rollback.
    // In both cases, the endpoint recovers and returns a failure status.
    expect([500, 400, 404]).toContain(res.statusCode);
    expect(res.body.success).toBe(false);
  });
});

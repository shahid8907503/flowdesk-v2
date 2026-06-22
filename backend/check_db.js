require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Workspace = require('./models/Workspace');
const WorkspaceMember = require('./models/WorkspaceMember');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const users = await User.find({});
  console.log('--- USERS ---');
  users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}`));

  const workspaces = await Workspace.find({});
  console.log('\n--- WORKSPACES ---');
  workspaces.forEach(w => console.log(`ID: ${w._id}, Name: ${w.name}, Owner: ${w.owner}`));

  const members = await WorkspaceMember.find({});
  console.log('\n--- WORKSPACE MEMBERS ---');
  members.forEach(m => console.log(`ID: ${m._id}, WS ID: ${m.workspaceId}, User ID: ${m.userId}, Role: ${m.role}`));

  await mongoose.disconnect();
}

check().catch(console.error);

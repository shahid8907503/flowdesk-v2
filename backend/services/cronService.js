const cron = require('node-cron');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const Board = require('../models/Board');
const Card = require('../models/Card');
const Column = require('../models/Column');
const { sendEmail } = require('../config/mailer');
const logger = require('../config/logger');

// Initialise scheduled jobs
const initCronJobs = () => {
  // Run daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    logger.info('Starting daily workspace digest cron job...');
    await sendDailyDigests();
  });
};

const sendDailyDigests = async () => {
  try {
    const users = await User.find({ isVerified: true });
    
    for (const user of users) {
      // Find all memberships
      const memberships = await WorkspaceMember.find({ userId: user._id });
      if (memberships.length === 0) continue;

      const workspaceSummaries = [];

      for (const member of memberships) {
        const workspace = await Workspace.findById(member.workspaceId);
        if (!workspace) continue;

        // Fetch boards in this workspace
        const boards = await Board.find({ workspaceId: workspace._id, isArchived: false });
        const boardIds = boards.map(b => b._id);

        const now = new Date();

        // 1. Fetch overdue tasks assigned to the user in this workspace
        const overdueCards = await Card.find({
          boardId: { $in: boardIds },
          assignees: user._id,
          dueDate: { $lt: now },
          isArchived: false
        }).populate('boardId', 'name');

        // 2. Fetch upcoming deadlines (next 48 hours)
        const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const upcomingCards = await Card.find({
          boardId: { $in: boardIds },
          assignees: user._id,
          dueDate: { $gte: now, $lte: fortyEightHoursLater },
          isArchived: false
        }).populate('boardId', 'name');

        // Only include workspace if there are tasks to report
        if (overdueCards.length > 0 || upcomingCards.length > 0) {
          workspaceSummaries.push({
            name: workspace.name,
            overdue: overdueCards,
            upcoming: upcomingCards
          });
        }
      }

      if (workspaceSummaries.length > 0) {
        await sendDigestEmail(user, workspaceSummaries);
      }
    }
    logger.info('Daily workspace digest cron job finished successfully');
  } catch (error) {
    logger.error('Error during daily workspace digest cron execution:', error);
  }
};

const sendDigestEmail = async (user, summaries) => {
  const subject = 'FlowDesk Daily Digest: Your Workspace Update';

  // Construct premium HTML email template
  let workspacesHtml = '';
  for (const sum of summaries) {
    let overdueRows = sum.overdue.map(c => `
      <tr style="border-bottom: 1px solid #2d2d30;">
        <td style="padding: 12px; color: #ff6b6b; font-weight: bold;">${c.title}</td>
        <td style="padding: 12px; color: #a1a1aa;">${c.boardId.name}</td>
        <td style="padding: 12px; color: #ff6b6b;">${new Date(c.dueDate).toLocaleDateString()}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" style="padding: 12px; color: #71717a; text-align: center;">No overdue tasks! 🙌</td></tr>`;

    let upcomingRows = sum.upcoming.map(c => `
      <tr style="border-bottom: 1px solid #2d2d30;">
        <td style="padding: 12px; color: #e4e4e7; font-weight: bold;">${c.title}</td>
        <td style="padding: 12px; color: #a1a1aa;">${c.boardId.name}</td>
        <td style="padding: 12px; color: #f59e0b;">${new Date(c.dueDate).toLocaleDateString()}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" style="padding: 12px; color: #71717a; text-align: center;">No upcoming deadlines in 48h.</td></tr>`;

    workspacesHtml += `
      <div style="background: #1e1e24; border-radius: 8px; border: 1px solid #2d2d30; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
        <h3 style="margin-top: 0; color: #818cf8; border-bottom: 2px solid #818cf8; padding-bottom: 8px;">Workspace: ${sum.name}</h3>
        
        <h4 style="color: #ff6b6b; margin-bottom: 8px;">Overdue Tasks</h4>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #2d2d30; color: #a1a1aa;">
              <th style="padding: 8px 12px;">Task</th>
              <th style="padding: 8px 12px;">Board</th>
              <th style="padding: 8px 12px;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${overdueRows}
          </tbody>
        </table>

        <h4 style="color: #f59e0b; margin-top: 20px; margin-bottom: 8px;">Upcoming Deadlines (Next 48 Hours)</h4>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #2d2d30; color: #a1a1aa;">
              <th style="padding: 8px 12px;">Task</th>
              <th style="padding: 8px 12px;">Board</th>
              <th style="padding: 8px 12px;">Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${upcomingRows}
          </tbody>
        </table>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0c0a0f;
          color: #e4e4e7;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #121217;
          border-radius: 12px;
          padding: 30px;
          border: 1px solid #1f1f23;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          color: #818cf8;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -1px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #71717a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">FlowDesk</div>
          <p style="color: #a1a1aa; margin: 4px 0 0 0;">Your Daily Project Summary</p>
        </div>
        
        <p>Hello ${user.name},</p>
        <p>Here is your daily update regarding your assigned tasks in FlowDesk:</p>
        
        ${workspacesHtml}

        <p style="margin-top: 30px;">Keep crushing your goals!<br>— The FlowDesk Team</p>
        
        <div class="footer">
          This is an automated message from FlowDesk. You can adjust your notification preferences in settings.
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: user.email, subject, html });
};

module.exports = { initCronJobs, sendDailyDigests };

const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
const port = process.env.SMTP_PORT || process.env.EMAIL_PORT;
const user = process.env.SMTP_USER || process.env.EMAIL_USER;
const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

const hasSmtpConfig = host && port && user && pass;

if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for other ports (like 587)
    auth: {
      user,
      pass
    }
  });
} else {
  logger.warn('No SMTP credentials found in environment variables. Email notifications will be logged to the console.');
}

const sendEmail = async ({ to, subject, html }) => {
  const from = process.env.EMAIL_FROM || 'no-reply@flowdesk.io';
  if (transporter) {
    try {
      const info = await transporter.sendMail({ from, to, subject, html });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  } else {
    logger.info(`
========================================
[EMAIL LOG]
From: ${from}
To: ${to}
Subject: ${subject}
Content:
${html}
========================================
    `);
    return { messageId: 'console-log-id' };
  }
};

module.exports = { sendEmail };

const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 characters')
});

const workspaceSchema = z.object({
  name: z.string().min(3, 'Workspace name must be at least 3 characters'),
  description: z.string().optional()
});

const boardSchema = z.object({
  workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Workspace ID'),
  name: z.string().min(2, 'Board name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional()
});

const columnSchema = z.object({
  boardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Board ID'),
  name: z.string().min(1, 'Column name must be at least 1 character'),
  position: z.number().nonnegative()
});

const cardSchema = z.object({
  columnId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Column ID'),
  boardId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Board ID'),
  title: z.string().min(1, 'Card title is required'),
  description: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).optional(),
  storyPoints: z.number().nonnegative().optional()
});

const moveCardSchema = z.object({
  columnId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Column ID'),
  position: z.number().nonnegative()
});

const webhookSchema = z.object({
  url: z.string().url('Invalid URL format'),
  secret: z.string().min(8, 'Secret must be at least 8 characters'),
  events: z.array(z.string()).optional()
});

module.exports = {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  workspaceSchema,
  boardSchema,
  columnSchema,
  cardSchema,
  moveCardSchema,
  webhookSchema
};

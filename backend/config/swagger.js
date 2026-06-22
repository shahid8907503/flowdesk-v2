const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'FlowDesk API',
    version: '1.0.0',
    description: 'Enterprise-grade SaaS Project Management Kanban Backend API with JavaScript only.'
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/auth/signup': {
      post: {
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  confirmPassword: { type: 'string' }
                },
                required: ['name', 'email', 'password', 'confirmPassword']
              }
            }
          }
        },
        responses: {
          201: { description: 'Registration successful. Verification email sent.' },
          400: { description: 'Validation errors or email taken.' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in and obtain JWT access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Successful login (or 2FA OTP prompt)' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/verify-2fa': {
      post: {
        summary: 'Verify OTP code for users with 2FA enabled',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  otp: { type: 'string' }
                },
                required: ['email', 'otp']
              }
            }
          }
        },
        responses: {
          200: { description: '2FA authentication successful. Access token returned.' },
          401: { description: 'Invalid OTP' }
        }
      }
    },
    '/auth/verify-email': {
      get: {
        summary: 'Verify email using activation token',
        parameters: [
          { name: 'token', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Email verified successfully.' },
          400: { description: 'Invalid or expired token.' }
        }
      }
    },
    '/workspaces': {
      get: {
        summary: 'Get all workspaces where current user is a member',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of workspaces returned.' }
        }
      },
      post: {
        summary: 'Create a new workspace',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['name']
              }
            }
          }
        },
        responses: {
          201: { description: 'Workspace created successfully.' }
        }
      }
    },
    '/boards': {
      get: {
        summary: 'Get all active boards in workspace',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'workspaceId', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'List of boards returned.' }
        }
      },
      post: {
        summary: 'Create a board (Automatically creates 5 columns)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  workspaceId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  color: { type: 'string' }
                },
                required: ['workspaceId', 'name']
              }
            }
          }
        },
        responses: {
          201: { description: 'Board created successfully.' }
        }
      }
    },
    '/cards': {
      post: {
        summary: 'Create a card in column',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  columnId: { type: 'string' },
                  boardId: { type: 'string' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                  storyPoints: { type: 'integer' }
                },
                required: ['columnId', 'boardId', 'title']
              }
            }
          }
        },
        responses: {
          201: { description: 'Card created.' }
        }
      }
    },
    '/cards/{id}/start-timer': {
      post: {
        summary: 'Start working timer on card',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Timer started.' }
        }
      }
    },
    '/cards/{id}/stop-timer': {
      post: {
        summary: 'Stop working timer on card',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Timer stopped.' }
        }
      }
    },
    '/analytics/burndown': {
      get: {
        summary: 'Fetch sprint burn-down details for a board',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'boardId', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Burn-down analytics data.' }
        }
      }
    },
    '/health': {
      get: {
        summary: 'System health monitoring status',
        responses: {
          200: { description: 'Database and server metrics.' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = { setupSwagger };

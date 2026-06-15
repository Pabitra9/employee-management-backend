'use strict';

const env = require('./env');

/**
 * Complete OpenAPI 3.0 specification, served via swagger-ui-express at /api-docs.
 *
 * Kept as a single explicit object (rather than scattered JSDoc annotations)
 * so the documentation is guaranteed complete and renders deterministically.
 */
const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Employee Management API',
    version: '1.0.0',
    description:
      'Production-ready REST API with JWT authentication, role-based access ' +
      'control, and Employee CRUD.\n\n' +
      '**Auth:** call `/auth/login`, copy the returned `token`, then click ' +
      '**Authorize** and paste it to call protected endpoints.',
  },
  servers: [{ url: `http://localhost:${env.port}/api`, description: 'Local server' }],
  tags: [
    { name: 'Auth', description: 'Authentication & profile' },
    { name: 'Employees', description: 'Employee CRUD (admin only)' },
    { name: 'System', description: 'Health & status' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c2a9b1e4a0012ab34cd' },
          name: { type: 'string', example: 'Admin User' },
          email: { type: 'string', example: 'admin@example.com' },
          role: { type: 'string', enum: ['admin', 'employee'], example: 'admin' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '665f1c2a9b1e4a0012ab34ce' },
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', example: 'jane.doe@example.com' },
          phone: { type: 'string', example: '+1-202-555-0143' },
          designation: { type: 'string', example: 'Software Engineer' },
          department: { type: 'string', example: 'Engineering' },
          salary: { type: 'number', example: 85000 },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          createdBy: { $ref: '#/components/schemas/User' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', example: 'jane@example.com' },
          password: { type: 'string', format: 'password', example: 'Secret@123' },
          role: { type: 'string', enum: ['admin', 'employee'], example: 'employee' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@example.com' },
          password: { type: 'string', format: 'password', example: 'Admin@123' },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'New Name' },
          password: { type: 'string', format: 'password', example: 'NewSecret@123' },
        },
      },
      EmployeeInput: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'phone', 'designation', 'department', 'salary'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', example: 'jane.doe@example.com' },
          phone: { type: 'string', example: '+1-202-555-0143' },
          designation: { type: 'string', example: 'Software Engineer' },
          department: { type: 'string', example: 'Engineering' },
          salary: { type: 'number', example: 85000 },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Unauthorized' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'A valid email is required' },
              },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Forbidden: {
        description: 'Authenticated but not permitted',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      ValidationError: {
        description: 'Request failed validation',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: { 200: { description: 'API is healthy' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: {
          201: {
            description: 'User registered',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password-reset link',
        description:
          'Always returns 200 (to avoid email enumeration). In non-production the ' +
          'reset token/URL is included in the response for testing.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', example: 'admin@example.com' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset link sent (if the account exists)', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using a token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string', example: 'a1b2c3d4...' },
                  password: { type: 'string', format: 'password', example: 'NewSecret@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          400: { description: 'Invalid or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile fetched', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      put: {
        tags: ['Auth'],
        summary: 'Update own profile (name/password)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileInput' } } },
        },
        responses: {
          200: { description: 'Profile updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (stateless)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Logged out', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/employees': {
      get: {
        tags: ['Employees'],
        summary: 'List employees (admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Match name or email' },
          { name: 'department', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
        ],
        responses: {
          200: { description: 'List of employees', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Employees'],
        summary: 'Create an employee (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeInput' } } },
        },
        responses: {
          201: { description: 'Employee created', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          409: { description: 'Duplicate email', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/employees/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Employees'],
        summary: 'Get an employee by id (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Employee fetched', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Employees'],
        summary: 'Update an employee (admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeInput' } } },
        },
        responses: {
          200: { description: 'Employee updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationError' },
        },
      },
      delete: {
        tags: ['Employees'],
        summary: 'Delete an employee (admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Employee deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;

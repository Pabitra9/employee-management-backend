'use strict';

const { body, param } = require('express-validator');

/** Validates a Mongo ObjectId route param (:id). */
const idParamValidator = [
  param('id').isMongoId().withMessage('Invalid employee id'),
];

/** Rules for POST /api/employees (all required). */
const createEmployeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('A valid email is required')
    .toLowerCase(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^[0-9+()\-\s]{7,20}$/)
    .withMessage('Phone must be a valid phone number'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('salary')
    .notEmpty()
    .withMessage('Salary is required')
    .bail()
    .isFloat({ min: 0 })
    .withMessage('Salary must be a non-negative number'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
];

/** Rules for PUT /api/employees/:id (all optional, but validated if present). */
const updateEmployeeValidator = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().trim().isEmail().withMessage('A valid email is required').toLowerCase(),
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+()\-\s]{7,20}$/)
    .withMessage('Phone must be a valid phone number'),
  body('designation').optional().trim().notEmpty().withMessage('Designation cannot be empty'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a non-negative number'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
];

module.exports = {
  idParamValidator,
  createEmployeeValidator,
  updateEmployeeValidator,
};

'use strict';

const express = require('express');

const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/authorize.middleware');
const validate = require('../middleware/validate.middleware');
const {
  idParamValidator,
  createEmployeeValidator,
  updateEmployeeValidator,
} = require('../validators/employee.validator');

const router = express.Router();

/**
 * Every employee route requires a valid token AND the `admin` role.
 * (Employees manage their own *user* profile via /api/auth/me.)
 */
router.use(authenticate, authorize('admin'));

router
  .route('/')
  .get(employeeController.getEmployees)
  .post(createEmployeeValidator, validate, employeeController.createEmployee);

router
  .route('/:id')
  .get(idParamValidator, validate, employeeController.getEmployee)
  .put(idParamValidator, updateEmployeeValidator, validate, employeeController.updateEmployee)
  .delete(idParamValidator, validate, employeeController.deleteEmployee);

module.exports = router;

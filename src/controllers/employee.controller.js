'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const employeeService = require('../services/employee.service');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * GET /api/employees
 * Admin only — list employees (paginated, filterable).
 */
const getEmployees = asyncHandler(async (req, res) => {
  const { employees, pagination } = await employeeService.listEmployees(req.query);
  return sendSuccess(res, 200, 'Employees fetched successfully', {
    employees,
    pagination,
  });
});

/**
 * GET /api/employees/:id
 * Admin only — fetch a single employee.
 */
const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  return sendSuccess(res, 200, 'Employee fetched successfully', { employee });
});

/**
 * POST /api/employees
 * Admin only — create an employee.
 */
const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body, req.user._id);
  return sendSuccess(res, 201, 'Employee created successfully', { employee });
});

/**
 * PUT /api/employees/:id
 * Admin only — update an employee.
 */
const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  return sendSuccess(res, 200, 'Employee updated successfully', { employee });
});

/**
 * DELETE /api/employees/:id
 * Admin only — delete an employee.
 */
const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.deleteEmployee(req.params.id);
  return sendSuccess(res, 200, 'Employee deleted successfully', {
    employee: { id: employee._id },
  });
});

module.exports = {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

'use strict';

const Employee = require('../models/employee.model');
const ApiError = require('../utils/ApiError');

/**
 * List employees with pagination, optional search, and filters.
 *
 * @param {object} [query]
 * @param {number} [query.page=1]
 * @param {number} [query.limit=10]
 * @param {string} [query.search]      Matches first/last name or email.
 * @param {string} [query.department]
 * @param {string} [query.status]      'active' | 'inactive'
 * @returns {Promise<{ employees: object[], pagination: object }>}
 */
const listEmployees = async (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;
  if (query.search) {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
  }

  const [employees, total] = await Promise.all([
    Employee.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  return {
    employees,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    },
  };
};

/**
 * Get a single employee by id.
 * @param {string} id
 * @returns {Promise<object>}
 * @throws {ApiError} 404 if not found.
 */
const getEmployeeById = async (id) => {
  const employee = await Employee.findById(id).populate('createdBy', 'name email role');
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
  return employee;
};

/**
 * Create an employee.
 * @param {object} data       Validated employee fields.
 * @param {string} createdBy  Id of the admin creating the record.
 * @returns {Promise<object>}
 * @throws {ApiError} 409 if the email already exists.
 */
const createEmployee = async (data, createdBy) => {
  const existing = await Employee.findOne({ email: data.email });
  if (existing) {
    throw new ApiError(409, 'An employee with this email already exists');
  }
  const employee = await Employee.create({ ...data, createdBy });
  return employee;
};

/**
 * Update an employee by id.
 * @param {string} id
 * @param {object} updates
 * @returns {Promise<object>}
 * @throws {ApiError} 404 if not found, 409 on email collision.
 */
const updateEmployee = async (id, updates) => {
  if (updates.email) {
    const clash = await Employee.findOne({ email: updates.email, _id: { $ne: id } });
    if (clash) {
      throw new ApiError(409, 'An employee with this email already exists');
    }
  }

  const employee = await Employee.findByIdAndUpdate(id, updates, {
    new: true, // return the updated document
    runValidators: true, // enforce schema rules on update
  }).populate('createdBy', 'name email role');

  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
  return employee;
};

/**
 * Delete an employee by id.
 * @param {string} id
 * @returns {Promise<object>} The deleted document.
 * @throws {ApiError} 404 if not found.
 */
const deleteEmployee = async (id) => {
  const employee = await Employee.findByIdAndDelete(id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found');
  }
  return employee;
};

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

'use strict';

/**
 * Database seed script.
 *
 * Usage:
 *   npm run seed           # insert/refresh seed users + sample employees
 *   npm run seed:destroy   # remove all users and employees
 *
 * Seeds the two required accounts:
 *   admin@example.com    / Admin@123     (role: admin)
 *   employee@example.com / Employee@123  (role: employee)
 */
const mongoose = require('mongoose');

const env = require('../config/env');
const logger = require('../utils/logger');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/user.model');
const Employee = require('../models/employee.model');

/** Sample employee records created by the admin (nice for immediate testing). */
const sampleEmployees = [
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '+1-202-555-0143',
    designation: 'Software Engineer',
    department: 'Engineering',
    salary: 85000,
    status: 'active',
  },
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1-202-555-0177',
    designation: 'Product Manager',
    department: 'Product',
    salary: 95000,
    status: 'active',
  },
  {
    firstName: 'Aisha',
    lastName: 'Khan',
    email: 'aisha.khan@example.com',
    phone: '+1-202-555-0190',
    designation: 'HR Specialist',
    department: 'Human Resources',
    salary: 60000,
    status: 'inactive',
  },
];

/** Insert seed data (idempotent: clears the collections first). */
const importData = async () => {
  // Clear existing data so re-running produces a clean, predictable state.
  await Employee.deleteMany();
  await User.deleteMany();

  // NOTE: create() (not insertMany) so the password-hashing pre-save hook runs.
  const admin = await User.create({
    name: 'Admin User',
    email: env.seed.adminEmail,
    password: env.seed.adminPassword,
    role: 'admin',
  });

  await User.create({
    name: 'Employee User',
    email: env.seed.employeeEmail,
    password: env.seed.employeePassword,
    role: 'employee',
  });

  // Attribute sample employees to the admin.
  await Employee.create(sampleEmployees.map((e) => ({ ...e, createdBy: admin._id })));

  logger.info('Seed data imported successfully:');
  logger.info(`  Admin    -> ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  logger.info(`  Employee -> ${env.seed.employeeEmail} / ${env.seed.employeePassword}`);
  logger.info(`  ${sampleEmployees.length} sample employee records created`);
};

/** Remove all seeded data. */
const destroyData = async () => {
  await Employee.deleteMany();
  await User.deleteMany();
  logger.info('All users and employees removed');
};

/** Entry point. */
const run = async () => {
  try {
    await connectDB();

    if (process.argv.includes('--destroy')) {
      await destroyData();
    } else {
      await importData();
    }
  } catch (err) {
    logger.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
};

run();

// Jest setup file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://username:password@localhost:5432/agenda_appointment_test_db?schema=public';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';

// Global test setup
beforeAll(() => {
  console.log('Setting up test environment...');
});

afterAll(() => {
  console.log('Cleaning up test environment...');
});

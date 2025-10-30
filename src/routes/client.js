const express = require('express');
const { body, param, query } = require('express-validator');
const clientController = require('../controllers/clientController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = express.Router();

// Validation rules for creating a client
const createClientValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('Birthday must be a valid date in YYYY-MM-DD format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

// Validation rules for getting clients
const getClientsValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Validation rules for getting a single client
const getClientValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('clientId')
    .notEmpty()
    .withMessage('Client ID is required'),
];

// Validation rules for updating a client
const updateClientValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('clientId')
    .notEmpty()
    .withMessage('Client ID is required'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('Birthday must be a valid date in YYYY-MM-DD format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

// Validation rules for deleting a client
const deleteClientValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('clientId')
    .notEmpty()
    .withMessage('Client ID is required'),
];

// Client routes
router.post('/users/:userId/clients', 
  authenticateToken,
  createClientValidation, 
  handleValidationErrors, 
  clientController.createClient
);

router.get('/users/:userId/clients', 
  authenticateToken,
  getClientsValidation, 
  handleValidationErrors, 
  clientController.getClients
);

router.get('/users/:userId/clients/:clientId', 
  authenticateToken,
  getClientValidation, 
  handleValidationErrors, 
  clientController.getClient
);

router.put('/users/:userId/clients/:clientId', 
  authenticateToken,
  updateClientValidation, 
  handleValidationErrors, 
  clientController.updateClient
);

router.delete('/users/:userId/clients/:clientId', 
  authenticateToken,
  deleteClientValidation, 
  handleValidationErrors, 
  clientController.deleteClient
);

// ====== STORE-BASED CLIENT ROUTES ======

// Validation rules for creating a client under a store (name and phone REQUIRED)
const createClientUnderStoreValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('storeId')
    .notEmpty()
    .withMessage('Store ID is required'),
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be between 1 and 100 characters'),
  body('phone')
    .notEmpty()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone is required and must be a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('Birthday must be a valid date in YYYY-MM-DD format'),
  body('information')
    .optional()
    .isArray()
    .withMessage('Information must be an array')
    .custom((value) => {
      if (value && Array.isArray(value)) {
        for (const item of value) {
          if (!item || typeof item !== 'object') {
            throw new Error('Information array must contain objects');
          }
          if (item.note && typeof item.note !== 'string') {
            throw new Error('Information note must be a string');
          }
          if (item.image && !Array.isArray(item.image)) {
            throw new Error('Information image must be an array');
          }
          if (item.date && typeof item.date !== 'string') {
            throw new Error('Information date must be a string');
          }
        }
      }
      return true;
    }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

// Validation rules for getting clients under a store
const getClientsUnderStoreValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('storeId')
    .notEmpty()
    .withMessage('Store ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Validation rules for getting a single client under a store
const getClientUnderStoreValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('storeId')
    .notEmpty()
    .withMessage('Store ID is required'),
  param('clientId')
    .notEmpty()
    .withMessage('Client ID is required'),
];

// Validation rules for updating a client under a store
const updateClientUnderStoreValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('storeId')
    .notEmpty()
    .withMessage('Store ID is required'),
  param('clientId')
    .notEmpty()
    .withMessage('Client ID is required'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Phone must be a valid phone number'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('Birthday must be a valid date in YYYY-MM-DD format'),
  body('information')
    .optional()
    .isArray()
    .withMessage('Information must be an array')
    .custom((value) => {
      if (value && Array.isArray(value)) {
        for (const item of value) {
          if (!item || typeof item !== 'object') {
            throw new Error('Information array must contain objects');
          }
          if (item.note && typeof item.note !== 'string') {
            throw new Error('Information note must be a string');
          }
          if (item.image && !Array.isArray(item.image)) {
            throw new Error('Information image must be an array');
          }
          if (item.date && typeof item.date !== 'string') {
            throw new Error('Information date must be a string');
          }
        }
      }
      return true;
    }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
];

// Validation rules for deleting a client under a store
const deleteClientUnderStoreValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  param('storeId')
    .notEmpty()
    .withMessage('Store ID is required'),
  param('clientId')
    .notEmpty()
    .withMessage('Client ID is required'),
];

// Store-based client routes
router.post('/users/:userId/stores/:storeId/clients', 
  authenticateToken,
  createClientUnderStoreValidation, 
  handleValidationErrors, 
  clientController.createClientUnderStore
);

router.get('/users/:userId/stores/:storeId/clients', 
  authenticateToken,
  getClientsUnderStoreValidation, 
  handleValidationErrors, 
  clientController.getClientsUnderStore
);

router.get('/users/:userId/stores/:storeId/clients/:clientId', 
  authenticateToken,
  getClientUnderStoreValidation, 
  handleValidationErrors, 
  clientController.getClientUnderStore
);

router.put('/users/:userId/stores/:storeId/clients/:clientId', 
  authenticateToken,
  updateClientUnderStoreValidation, 
  handleValidationErrors, 
  clientController.updateClientUnderStore
);

router.delete('/users/:userId/stores/:storeId/clients/:clientId', 
  authenticateToken,
  deleteClientUnderStoreValidation, 
  handleValidationErrors, 
  clientController.deleteClientUnderStore
);

module.exports = router;

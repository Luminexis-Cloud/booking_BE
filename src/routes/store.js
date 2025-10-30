const express = require('express');
const { body, param, query } = require('express-validator');
const storeController = require('../controllers/storeController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = express.Router();

// Validation rules for store creation
const createStoreValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name is required and must be between 1 and 100 characters'),
  body('areaOfWork')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Area of work is required and must be between 1 and 50 characters'),
  body('teamSize')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Team size must be a positive integer between 1 and 1000'),
  body('date')
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/)
    .withMessage('Date must be in DD-MM-YYYY format'),
  body('signature')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Signature is required and must be between 1 and 200 characters'),
];

// Validation rules for store update
const updateStoreValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name must be between 1 and 100 characters'),
  body('areaOfWork')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Area of work must be between 1 and 50 characters'),
  body('teamSize')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Team size must be a positive integer between 1 and 1000'),
  body('date')
    .optional()
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/)
    .withMessage('Date must be in DD-MM-YYYY format'),
  body('signature')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Signature must be between 1 and 200 characters'),
];

// Validation rules for getting stores
const getStoresValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Validation rules for getting single store
const getStoreValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
];

// Validation rules for deleting store
const deleteStoreValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
];

// Store routes
router.post('/users/:userId/stores',
  authenticateToken,
  createStoreValidation,
  handleValidationErrors,
  storeController.createStore
);

router.get('/users/:userId/stores',
  authenticateToken,
  getStoresValidation,
  handleValidationErrors,
  storeController.getStoresByUser
);

router.get('/users/:userId/stores/:storeId',
  authenticateToken,
  getStoreValidation,
  handleValidationErrors,
  storeController.getStoreById
);

router.put('/users/:userId/stores/:storeId',
  authenticateToken,
  updateStoreValidation,
  handleValidationErrors,
  storeController.updateStore
);

router.delete('/users/:userId/stores/:storeId',
  authenticateToken,
  deleteStoreValidation,
  handleValidationErrors,
  storeController.deleteStore
);

module.exports = router;

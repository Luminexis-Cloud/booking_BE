const express = require('express');
const { body, param, query } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = express.Router();

// Validation rules for service creation
const createServiceValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name is required and must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('durationMinutes')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be a positive integer between 1 and 1440 minutes'),
  body('price')
    .isObject()
    .withMessage('Price must be an object'),
  body('price.amount')
    .isNumeric()
    .withMessage('Price amount must be a number'),
  body('price.currency')
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Price currency must be a 3-character string'),
  body('price.taxIncluded')
    .isBoolean()
    .withMessage('Price taxIncluded must be a boolean'),
  body('colorHex')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  body('deposit')
    .isObject()
    .withMessage('Deposit must be an object'),
  body('deposit.type')
    .isIn(['percentage', 'fixed'])
    .withMessage('Deposit type must be either "percentage" or "fixed"'),
  body('deposit.value')
    .isNumeric()
    .withMessage('Deposit value must be a number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('date')
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/)
    .withMessage('Date must be in DD-MM-YYYY format'),
];

// Validation rules for service update
const updateServiceValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('serviceId')
    .isString()
    .notEmpty()
    .withMessage('Valid service ID is required'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be a positive integer between 1 and 1440 minutes'),
  body('price')
    .optional()
    .isObject()
    .withMessage('Price must be an object'),
  body('price.amount')
    .optional()
    .isNumeric()
    .withMessage('Price amount must be a number'),
  body('price.currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Price currency must be a 3-character string'),
  body('price.taxIncluded')
    .optional()
    .isBoolean()
    .withMessage('Price taxIncluded must be a boolean'),
  body('colorHex')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  body('deposit')
    .optional()
    .isObject()
    .withMessage('Deposit must be an object'),
  body('deposit.type')
    .optional()
    .isIn(['percentage', 'fixed'])
    .withMessage('Deposit type must be either "percentage" or "fixed"'),
  body('deposit.value')
    .optional()
    .isNumeric()
    .withMessage('Deposit value must be a number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('date')
    .optional()
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/)
    .withMessage('Date must be in DD-MM-YYYY format'),
];

// Validation rules for getting services
const getServicesValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Validation rules for getting single service
const getServiceValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('serviceId')
    .isString()
    .notEmpty()
    .withMessage('Valid service ID is required'),
];

// Validation rules for deleting service
const deleteServiceValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('serviceId')
    .isString()
    .notEmpty()
    .withMessage('Valid service ID is required'),
];

// Service routes
router.post('/users/:userId/stores/:storeId/services',
  authenticateToken,
  createServiceValidation,
  handleValidationErrors,
  serviceController.createService
);

router.get('/users/:userId/stores/:storeId/services',
  authenticateToken,
  getServicesValidation,
  handleValidationErrors,
  serviceController.getServicesByStore
);

router.get('/users/:userId/stores/:storeId/services/:serviceId',
  authenticateToken,
  getServiceValidation,
  handleValidationErrors,
  serviceController.getServiceById
);

router.put('/users/:userId/stores/:storeId/services/:serviceId',
  authenticateToken,
  updateServiceValidation,
  handleValidationErrors,
  serviceController.updateService
);

router.delete('/users/:userId/stores/:storeId/services/:serviceId',
  authenticateToken,
  deleteServiceValidation,
  handleValidationErrors,
  serviceController.deleteService
);

// ====== CATEGORY-BASED SERVICE ROUTES ======

// Validation rules for creating service under category
const createServiceUnderCategoryValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('categoryId')
    .isString()
    .notEmpty()
    .withMessage('Valid category ID is required'),
  body('name')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name is required and must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('durationMinutes')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be a positive integer between 1 and 1440 minutes'),
  body('price')
    .isObject()
    .withMessage('Price must be an object'),
  body('price.amount')
    .isNumeric()
    .withMessage('Price amount must be a number'),
  body('price.currency')
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Price currency must be a 3-character string'),
  body('price.taxIncluded')
    .isBoolean()
    .withMessage('Price taxIncluded must be a boolean'),
  body('colorHex')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  body('deposit')
    .isObject()
    .withMessage('Deposit must be an object'),
  body('deposit.type')
    .isIn(['percentage', 'fixed', 'none'])
    .withMessage('Deposit type must be either "percentage", "fixed", or "none"'),
  body('deposit.value')
    .optional()
    .isNumeric()
    .withMessage('Deposit value must be a number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('date')
    .matches(/^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/)
    .withMessage('Date must be in DD-MM-YYYY format'),
];

// Validation rules for updating service under category
const updateServiceUnderCategoryValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('categoryId')
    .isString()
    .notEmpty()
    .withMessage('Valid category ID is required'),
  param('serviceId')
    .isString()
    .notEmpty()
    .withMessage('Valid service ID is required'),
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be a positive integer between 1 and 1440 minutes'),
  body('price')
    .optional()
    .isObject()
    .withMessage('Price must be an object'),
  body('colorHex')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// Validation rules for getting services under category
const getServicesUnderCategoryValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('categoryId')
    .isString()
    .notEmpty()
    .withMessage('Valid category ID is required'),
];

// Validation rules for getting single service under category
const getServiceUnderCategoryValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('categoryId')
    .isString()
    .notEmpty()
    .withMessage('Valid category ID is required'),
  param('serviceId')
    .isString()
    .notEmpty()
    .withMessage('Valid service ID is required'),
];

// Validation rules for deleting service under category
const deleteServiceUnderCategoryValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
  param('categoryId')
    .isString()
    .notEmpty()
    .withMessage('Valid category ID is required'),
  param('serviceId')
    .isString()
    .notEmpty()
    .withMessage('Valid service ID is required'),
];

// Category-based service routes
router.post('/users/:userId/stores/:storeId/category/:categoryId/services',
  authenticateToken,
  createServiceUnderCategoryValidation,
  handleValidationErrors,
  serviceController.createServiceUnderCategory
);

router.get('/users/:userId/stores/:storeId/category/:categoryId/services',
  authenticateToken,
  getServicesUnderCategoryValidation,
  handleValidationErrors,
  serviceController.getServicesByCategory
);

router.get('/users/:userId/stores/:storeId/category/:categoryId/services/:serviceId',
  authenticateToken,
  getServiceUnderCategoryValidation,
  handleValidationErrors,
  serviceController.getServiceByCategoryId
);

router.put('/users/:userId/stores/:storeId/category/:categoryId/services/:serviceId',
  authenticateToken,
  updateServiceUnderCategoryValidation,
  handleValidationErrors,
  serviceController.updateServiceUnderCategory
);

router.delete('/users/:userId/stores/:storeId/category/:categoryId/services/:serviceId',
  authenticateToken,
  deleteServiceUnderCategoryValidation,
  handleValidationErrors,
  serviceController.deleteServiceUnderCategory
);

module.exports = router;

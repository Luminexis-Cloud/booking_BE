const express = require('express');
const { body, param } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middlewares/auth');
const { handleValidationErrors } = require('../middlewares/validation');

const router = express.Router();

// Validation rules for category creation
const createCategoryValidation = [
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
    .withMessage('Category name is required and must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

// Validation rules for category update
const updateCategoryValidation = [
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
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

// Validation rules for getting categories
const getCategoriesValidation = [
  param('userId')
    .isString()
    .notEmpty()
    .withMessage('Valid user ID is required'),
  param('storeId')
    .isString()
    .notEmpty()
    .withMessage('Valid store ID is required'),
];

// Validation rules for getting single category
const getCategoryValidation = [
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

// Validation rules for deleting category
const deleteCategoryValidation = [
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

// Category routes for Store
router.post('/users/:userId/stores/:storeId/category',
  authenticateToken,
  createCategoryValidation,
  handleValidationErrors,
  categoryController.createCategory
);

router.get('/users/:userId/stores/:storeId/categories',
  authenticateToken,
  getCategoriesValidation,
  handleValidationErrors,
  categoryController.getCategoriesByStore
);

router.get('/users/:userId/stores/:storeId/categories/:categoryId',
  authenticateToken,
  getCategoryValidation,
  handleValidationErrors,
  categoryController.getCategoryById
);

router.put('/users/:userId/stores/:storeId/categories/:categoryId',
  authenticateToken,
  updateCategoryValidation,
  handleValidationErrors,
  categoryController.updateCategory
);

router.delete('/users/:userId/stores/:storeId/categories/:categoryId',
  authenticateToken,
  deleteCategoryValidation,
  handleValidationErrors,
  categoryController.deleteCategory
);

module.exports = router;

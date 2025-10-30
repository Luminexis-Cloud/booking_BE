const categoryService = require('../services/categoryService');
const { sendSuccess, sendError } = require('../utils/response');

class CategoryController {
  // Create Category for a Store
  async createCategory(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const { name, description } = req.body;

      const categoryData = {
        name,
        description,
        storeId,
        userId,
      };

      const category = await categoryService.createCategory(categoryData);

      return sendSuccess(res, 'Category created successfully', {
        category: {
          categoryId: category.categoryId,
          userId,
          storeId,
          name: category.name,
          description: category.description,
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // Get All Categories of a Store
  async getCategoriesByStore(req, res, next) {
    try {
      const { userId, storeId } = req.params;

      const categories = await categoryService.getCategoriesByStore(storeId, userId);

      const formattedCategories = categories.map(category => ({
        categoryId: category.categoryId,
        userId,
        storeId,
        name: category.name,
        description: category.description,
      }));

      return sendSuccess(res, 'All categories fetched successfully', {
        userId,
        storeId,
        categories: formattedCategories,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Single Category of a Store
  async getCategoryById(req, res, next) {
    try {
      const { userId, storeId, categoryId } = req.params;

      const category = await categoryService.getCategoryById(categoryId, storeId, userId);

      return sendSuccess(res, 'Category fetched successfully', {
        category: {
          categoryId: category.categoryId,
          userId,
          storeId,
          name: category.name,
          description: category.description,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Category of a Store
  async updateCategory(req, res, next) {
    try {
      const { userId, storeId, categoryId } = req.params;
      const updateData = req.body;

      const category = await categoryService.updateCategory(categoryId, updateData, storeId, userId);

      return sendSuccess(res, 'Category updated successfully', {
        category: {
          categoryId: category.categoryId,
          userId,
          storeId,
          name: category.name,
          description: category.description,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Category of a Store
  async deleteCategory(req, res, next) {
    try {
      const { userId, storeId, categoryId } = req.params;

      const result = await categoryService.deleteCategory(categoryId, storeId, userId);

      return sendSuccess(res, 'Category deleted successfully', {
        message: 'Category deleted successfully',
        categoryId: result.categoryId,
        storeId: result.storeId,
        userId: result.userId,
      }, 204);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();

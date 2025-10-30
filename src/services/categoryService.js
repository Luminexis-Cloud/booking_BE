const Category = require('../models/Category');

class CategoryService {
  async createCategory(categoryData) {
    return await Category.createCategory(categoryData);
  }

  async getCategoriesByStore(storeId, userId) {
    return await Category.getCategoriesByStore(storeId, userId);
  }

  async getCategoryById(categoryId, storeId, userId) {
    return await Category.getCategoryById(categoryId, storeId, userId);
  }

  async updateCategory(categoryId, updateData, storeId, userId) {
    return await Category.updateCategory(categoryId, updateData, storeId, userId);
  }

  async deleteCategory(categoryId, storeId, userId) {
    return await Category.deleteCategory(categoryId, storeId, userId);
  }
}

module.exports = new CategoryService();

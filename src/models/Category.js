// Custom Category Model - Business Logic Layer
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class Category {
  // Business validation rules
  static validateName(name) {
    if (!name || name.trim().length < 1) {
      throw new Error('Category name is required');
    }
    if (name.trim().length > 100) {
      throw new Error('Category name must be less than 100 characters');
    }
    return true;
  }

  static validateDescription(description) {
    if (description && description.trim().length > 500) {
      throw new Error('Description must be less than 500 characters');
    }
    return true;
  }

  // Helper method to validate store ownership
  static async validateStoreOwnership(storeId, userId) {
    console.log('Validating store ownership:', { storeId, userId });
    
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId: userId,
      },
    });

    if (!store) {
      // Try to find the store without userId check for debugging
      const storeExists = await prisma.store.findFirst({
        where: { id: storeId },
        select: { id: true, userId: true, name: true }
      });
      
      console.log('Store exists:', storeExists);
      
      if (!storeExists) {
        throw new Error('Store not found');
      } else {
        throw new Error(`Store found but userId mismatch. Store userId: ${storeExists.userId}, Request userId: ${userId}`);
      }
    }

    return store;
  }

  // Business logic for category creation
  static async createCategory(categoryData) {
    const { name, description, storeId, userId } = categoryData;

    console.log('Creating category with data:', { name, description, storeId, userId });

    // Validate using business rules
    this.validateName(name);
    this.validateDescription(description);

    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Create category in database
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        storeId,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('Category created successfully:', category);
    return category;
  }

  // Business logic for getting all categories of a store
  static async getCategoriesByStore(storeId, userId) {
    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Get categories
    const categories = await prisma.category.findMany({
      where: {
        storeId,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return categories;
  }

  // Business logic for getting a single category
  static async getCategoryById(categoryId, storeId, userId) {
    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Get the specific category
    const category = await prisma.category.findFirst({
      where: {
        categoryId,
        storeId,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  // Business logic for updating a category
  static async updateCategory(categoryId, updateData, storeId, userId) {
    // Validate update data if provided
    if (updateData.name !== undefined) {
      this.validateName(updateData.name);
      updateData.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
      this.validateDescription(updateData.description);
      updateData.description = updateData.description ? updateData.description.trim() : null;
    }

    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Check if category exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        categoryId,
        storeId,
      },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Update category
    const category = await prisma.category.update({
      where: {
        id: existingCategory.id,
      },
      data: updateData,
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return category;
  }

  // Business logic for deleting a category
  static async deleteCategory(categoryId, storeId, userId) {
    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Check if category exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        categoryId,
        storeId,
      },
    });

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Delete category
    await prisma.category.delete({
      where: {
        id: existingCategory.id,
      },
    });

    return {
      categoryId,
      storeId,
      userId,
    };
  }
}

module.exports = Category;

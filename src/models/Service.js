// Custom Service Model - Business Logic Layer
const { PrismaClient } = require('@prisma/client');
const { ValidationError, NotFoundError, DatabaseError } = require('../utils/customErrors');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class Service {
  // Business validation rules
  static validateName(name) {
    if (!name || name.trim().length < 1) {
      throw new ValidationError("Service name is required", "name");
    }
    if (name.trim().length > 100) {
      throw new ValidationError(
        "Service name must be less than 100 characters",
        "name"
      );
    }
    return true;
  }

  static validateDescription(description) {
    if (description && description.trim().length > 500) {
      throw new ValidationError(
        "Description must be less than 500 characters",
        "description"
      );
    }
    return true;
  }

  static validateDurationMinutes(durationMinutes) {
    if (durationMinutes === undefined || durationMinutes === null) {
      throw new ValidationError("Duration is required", "durationMinutes");
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1) {
      throw new ValidationError(
        "Duration must be a positive integer",
        "durationMinutes"
      );
    }
    if (durationMinutes > 1440) {
      throw new ValidationError(
        "Duration must be less than 1440 minutes (24 hours)",
        "durationMinutes"
      );
    }
    return true;
  }

  static validatePrice(price) {
    if (!price || typeof price !== "object") {
      throw new ValidationError("Price must be an object", "price");
    }
    if (typeof price.amount !== "number" || price.amount < 0) {
      throw new ValidationError(
        "Price amount must be a non-negative number",
        "price.amount"
      );
    }
    if (
      !price.currency ||
      typeof price.currency !== "string" ||
      price.currency.length !== 3
    ) {
      throw new ValidationError(
        "Price currency must be a 3-character string",
        "price.currency"
      );
    }
    if (typeof price.taxIncluded !== "boolean") {
      throw new ValidationError(
        "Price taxIncluded must be a boolean",
        "price.taxIncluded"
      );
    }
    return true;
  }

  static validateColorHex(colorHex) {
    if (colorHex && !/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
      throw new ValidationError("Color must be a valid hex color", "colorHex");
    }
    return true;
  }

  static validateDeposit(deposit) {
    if (!deposit || typeof deposit !== "object") {
      throw new ValidationError("Deposit must be an object", "deposit");
    }
    if (!["percentage", "fixed"].includes(deposit.type)) {
      throw new ValidationError(
        'Deposit type must be either "percentage" or "fixed"',
        "deposit.type"
      );
    }
    if (typeof deposit.value !== "number" || deposit.value < 0) {
      throw new ValidationError(
        "Deposit value must be a non-negative number",
        "deposit.value"
      );
    }
    if (deposit.type === "percentage" && deposit.value > 100) {
      throw new ValidationError(
        "Percentage deposit cannot exceed 100%",
        "deposit.value"
      );
    }
    return true;
  }

  static validateDate(date) {
    if (!date || date.trim().length < 1) {
      throw new ValidationError("Date is required", "date");
    }
    // Validate DD-MM-YYYY format
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new ValidationError("Date must be in DD-MM-YYYY format", "date");
    }
    return true;
  }

  static async validateStoreOwnership(storeId, userId) {
    try {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          managerId: userId,
        },
        select: { id: true, name: true },
      });

      if (!store) {
        throw new NotFoundError("Store");
      }

      return store;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Database error in validateStoreOwnership:", error);
      throw new DatabaseError("Failed to validate store ownership");
    }
  }

  static async validateCategoryOwnership(categoryId, storeId, userId) {
    try {
      const category = await prisma.category.findFirst({
        where: {
          categoryId,
          storeId,
        },
        select: { id: true, categoryId: true, name: true, storeId: true },
      });

      if (!category) {
        throw new NotFoundError(
          `Category ${categoryId} not found for this store`
        );
      }

      return category;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Database error in validateCategoryOwnership:", error);
      throw new DatabaseError("Failed to validate category ownership");
    }
  }

  // ====== CATEGORY-BASED SERVICE METHODS ======

  // Business logic for creating a service under a category
  static async createServiceUnderCategory(serviceData) {
    const {
      name,
      description,
      durationMinutes,
      price,
      colorHex,
      deposit,
      isActive,
      date,
      storeId,
      categoryId,
      userId,
    } = serviceData;

    try {
      // Validate using business rules
      this.validateName(name);
      this.validateDescription(description);
      this.validateDurationMinutes(durationMinutes);
      this.validatePrice(price);
      this.validateColorHex(colorHex);
      this.validateDeposit(deposit);
      this.validateDate(date);

      // Validate store ownership
      //await this.validateStoreOwnership(storeId, userId);

      // Validate category ownership
      const category = await this.validateCategoryOwnership(
        categoryId,
        storeId,
        userId
      );

      // Create service in database
      const service = await prisma.service.create({
        data: {
          name: name.trim(),
          description: description ? description.trim() : null,
          durationMinutes: parseInt(durationMinutes),
          price: price,
          colorHex: colorHex || null,
          deposit: deposit,
          isActive: isActive !== undefined ? isActive : true,
          date: date.trim(),
          storeId,
          categoryId: category.id,
          // serviceId will be auto-generated by database default
        },
      });

      logger.info(`Service created under category: ${service.id}`);
      return service;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error("Error creating service under category:", error);
      console.error("Full error details:", error.message);
      console.error("Error code:", error.code);
      throw new DatabaseError(`Failed to create service: ${error.message}`);
    }
  }

  // Business logic for getting all services of a category
  static async getServicesByCategory(categoryId, storeId, userId) {
    try {
      // Validate category ownership
      const category = await this.validateCategoryOwnership(
        categoryId,
        storeId,
        userId
      );

      // Get services
      const services = await prisma.service.findMany({
        where: {
          categoryId: category.id,
        },
        select: {
          id: true,
          serviceId: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          colorHex: true,
          deposit: true,
          isActive: true,
          date: true,
          storeId: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      logger.info(
        `Retrieved ${services.length} services for category: ${categoryId}`
      );
      return services;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error("Error getting services by category:", error);
      throw new DatabaseError("Failed to retrieve services");
    }
  }

  // Business logic for getting a single service by serviceId
  static async getServiceByServiceId(serviceId, categoryId, storeId, userId) {
    try {
      // Validate category ownership
      const category = await this.validateCategoryOwnership(
        categoryId,
        storeId,
        userId
      );

      // Get the specific service
      const service = await prisma.service.findFirst({
        where: {
          serviceId,
          categoryId: category.id,
        },
        select: {
          id: true,
          serviceId: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          colorHex: true,
          deposit: true,
          isActive: true,
          date: true,
          storeId: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!service) {
        throw new NotFoundError("Service");
      }

      logger.info(`Retrieved service: ${serviceId}`);
      return service;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error("Error getting service by ID:", error);
      throw new DatabaseError("Failed to retrieve service");
    }
  }

  // Business logic for updating a service under category
  static async updateServiceUnderCategory(
    serviceId,
    updateData,
    categoryId,
    storeId,
    userId
  ) {
    try {
      if (updateData.name !== undefined) {
        this.validateName(updateData.name);
        updateData.name = updateData.name.trim();
      }
      if (updateData.description !== undefined) {
        this.validateDescription(updateData.description);
        updateData.description = updateData.description
          ? updateData.description.trim()
          : null;
      }
      if (updateData.durationMinutes !== undefined) {
        this.validateDurationMinutes(updateData.durationMinutes);
        updateData.durationMinutes = parseInt(updateData.durationMinutes);
      }
      if (updateData.price !== undefined) {
        this.validatePrice(updateData.price);
      }
      if (updateData.colorHex !== undefined) {
        this.validateColorHex(updateData.colorHex);
        updateData.colorHex = updateData.colorHex || null;
      }
      if (updateData.deposit !== undefined) {
        this.validateDeposit(updateData.deposit);
      }
      if (updateData.date !== undefined) {
        this.validateDate(updateData.date);
        updateData.date = updateData.date.trim();
      }

      const category = await this.validateCategoryOwnership(
        categoryId,
        storeId,
        userId
      );

      const existingService = await prisma.service.findFirst({
        where: {
          serviceId,
          categoryId: category.id,
        },
      });

      if (!existingService) {
        throw new NotFoundError("Service");
      }

      const service = await prisma.service.update({
        where: {
          id: existingService.id,
        },
        data: updateData,
        select: {
          id: true,
          serviceId: true,
          name: true,
          description: true,
          durationMinutes: true,
          price: true,
          colorHex: true,
          deposit: true,
          isActive: true,
          date: true,
          storeId: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Service updated successfully: ${serviceId}`);
      return service;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error("Error updating service:", error);
      throw new DatabaseError("Failed to update service");
    }
  }

  // Business logic for deleting a service under category
  static async deleteServiceUnderCategory(
    serviceId,
    categoryId,
    storeId,
    userId
  ) {
    try {
      const category = await this.validateCategoryOwnership(
        categoryId,
        storeId,
        userId
      );

      const existingService = await prisma.service.findFirst({
        where: {
          serviceId,
          categoryId: category.id,
        },
      });

      if (!existingService) {
        throw new NotFoundError("Service");
      }

      await prisma.service.delete({
        where: {
          id: existingService.id,
        },
      });

      logger.info(`Service deleted successfully: ${serviceId}`);

      return {
        serviceId,
        categoryId,
        storeId,
        userId,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error("Error deleting service:", error);
      throw new DatabaseError("Failed to delete service");
    }
  }

  static async getCategoriesWithServices(storeId, userId) {
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        managerId: userId,
      },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundError("Store not found or unauthorized.");
    }
    const categories = await prisma.category.findMany({
      where: {
        storeId,
        store: { managerId: userId },
      },
      select: {
        categoryId: true,
        name: true,
        description: true,
        createdAt: true,
        services: {
          select: {
            serviceId: true,
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
            colorHex: true,
            deposit: true,
            isActive: true,
            date: true,
          },
        },
      },
    });

    return categories;
  }
}

module.exports = Service;

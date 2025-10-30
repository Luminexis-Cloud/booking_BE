const serviceService = require('../services/serviceService');
const { sendSuccess, sendError } = require('../utils/response');

class ServiceController {
  // Create Service under a Store
  async createService(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const { name, description, durationMinutes, price, colorHex, deposit, isActive, date } = req.body;

      const serviceData = {
        name,
        description,
        durationMinutes,
        price,
        colorHex,
        deposit,
        isActive,
        date,
        storeId,
        userId,
      };

      const service = await serviceService.createService(serviceData);

      return sendSuccess(res, 'Service created successfully', {
        service: {
          serviceId: service.id,
          userId,
          storeId,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          colorHex: service.colorHex,
          deposit: service.deposit,
          isActive: service.isActive,
          date: service.date,
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // Get All Services of a Store
  async getServicesByStore(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100), // Max 100 items per page
      };

      const result = await serviceService.getServicesByStore(storeId, userId, options);

      const formattedServices = result.services.map(service => ({
        serviceId: service.id,
        userId,
        storeId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        colorHex: service.colorHex,
        deposit: service.deposit,
        isActive: service.isActive,
        date: service.date,
      }));

      return sendSuccess(res, 'All services fetched successfully', {
        userId,
        storeId,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        services: formattedServices,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Single Service of a Store
  async getServiceById(req, res, next) {
    try {
      const { userId, storeId, serviceId } = req.params;

      const service = await serviceService.getServiceById(serviceId, storeId, userId);

      return sendSuccess(res, 'Service fetched successfully', {
        service: {
          serviceId: service.id,
          userId,
          storeId,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          colorHex: service.colorHex,
          deposit: service.deposit,
          isActive: service.isActive,
          date: service.date,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Service of a Store
  async updateService(req, res, next) {
    try {
      const { userId, storeId, serviceId } = req.params;
      const updateData = req.body;

      const service = await serviceService.updateService(serviceId, updateData, storeId, userId);

      return sendSuccess(res, 'Service updated successfully', {
        service: {
          serviceId: service.id,
          userId,
          storeId,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          colorHex: service.colorHex,
          deposit: service.deposit,
          isActive: service.isActive,
          date: service.date,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Service of a Store
  async deleteService(req, res, next) {
    try {
      const { userId, storeId, serviceId } = req.params;

      const result = await serviceService.deleteService(serviceId, storeId, userId);

      return sendSuccess(res, 'Service deleted successfully', {
        message: 'Service deleted successfully',
        serviceId: result.serviceId,
        storeId: result.storeId,
        userId: result.userId,
      }, 204);
    } catch (error) {
      next(error);
    }
  }

  // ====== CATEGORY-BASED SERVICE CONTROLLERS ======

  // Create Service under a Category
  async createServiceUnderCategory(req, res, next) {
    try {
      const { userId, storeId, categoryId } = req.params;
      const { name, description, durationMinutes, price, colorHex, deposit, isActive, date } = req.body;

      const serviceData = {
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
      };

      const service = await serviceService.createServiceUnderCategory(serviceData);

      return sendSuccess(res, 'Service created successfully', {
        service: {
          serviceId: service.serviceId,
          userId,
          storeId,
          categoryId,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          colorHex: service.colorHex,
          deposit: service.deposit,
          isActive: service.isActive,
          date: service.date,
        }
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // Get All Services under a Category
  async getServicesByCategory(req, res, next) {
    try {
      const { userId, storeId, categoryId } = req.params;

      const services = await serviceService.getServicesByCategory(categoryId, storeId, userId);

      const formattedServices = services.map(service => ({
        serviceId: service.serviceId,
        userId,
        storeId,
        categoryId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        colorHex: service.colorHex,
        deposit: service.deposit,
        isActive: service.isActive,
        date: service.date,
      }));

      return sendSuccess(res, 'All services fetched successfully', {
        userId,
        storeId,
        categoryId,
        services: formattedServices,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Single Service under a Category
  async getServiceByCategoryId(req, res, next) {
    try {
      const { userId, storeId, categoryId, serviceId } = req.params;

      const service = await serviceService.getServiceByServiceId(serviceId, categoryId, storeId, userId);

      return sendSuccess(res, 'Service fetched successfully', {
        service: {
          serviceId: service.serviceId,
          userId,
          storeId,
          categoryId,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          colorHex: service.colorHex,
          deposit: service.deposit,
          isActive: service.isActive,
          date: service.date,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Service under a Category
  async updateServiceUnderCategory(req, res, next) {
    try {
      const { userId, storeId, categoryId, serviceId } = req.params;
      const updateData = req.body;

      const service = await serviceService.updateServiceUnderCategory(serviceId, updateData, categoryId, storeId, userId);

      return sendSuccess(res, 'Service updated successfully', {
        service: {
          serviceId: service.serviceId,
          userId,
          storeId,
          categoryId,
          name: service.name,
          description: service.description,
          durationMinutes: service.durationMinutes,
          price: service.price,
          colorHex: service.colorHex,
          deposit: service.deposit,
          isActive: service.isActive,
          date: service.date,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Service under a Category
  async deleteServiceUnderCategory(req, res, next) {
    try {
      const { userId, storeId, categoryId, serviceId } = req.params;

      const result = await serviceService.deleteServiceUnderCategory(serviceId, categoryId, storeId, userId);

      return sendSuccess(res, 'Service deleted successfully', {
        message: 'Service deleted successfully',
        serviceId: result.serviceId,
        categoryId: result.categoryId,
        storeId: result.storeId,
        userId: result.userId,
      }, 204);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceController();

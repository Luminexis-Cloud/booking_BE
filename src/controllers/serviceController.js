const serviceService = require('../services/serviceService');
const { sendSuccess } = require('../utils/response');

class ServiceController {

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
  async getCategoriesWithServices (req, res) {
  try {
    const { userId, storeId } = req.params;

    const result = await serviceService.getCategoriesWithServices(storeId, userId);

    return res.json({
      success: true,
      data: result
    });

  } catch (err) {
    console.error(err);

    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
}

module.exports = new ServiceController();

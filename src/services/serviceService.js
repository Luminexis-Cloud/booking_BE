const Service = require('../models/Service');
const logger = require('../utils/logger');

class ServiceService {
  // Category-based service methods
  async createServiceUnderCategory(serviceData) {
    logger.info('ServiceService: Creating service under category', { categoryId: serviceData.categoryId });
    return await Service.createServiceUnderCategory(serviceData);
  }

  async getServicesByCategory(categoryId, storeId, userId) {
    logger.info('ServiceService: Getting services by category', { categoryId, storeId, userId });
    return await Service.getServicesByCategory(categoryId, storeId, userId);
  }

  async getServiceByServiceId(serviceId, categoryId, storeId, userId) {
    logger.info('ServiceService: Getting service by serviceId', { serviceId, categoryId, storeId, userId });
    return await Service.getServiceByServiceId(serviceId, categoryId, storeId, userId);
  }

  async updateServiceUnderCategory(serviceId, updateData, categoryId, storeId, userId) {
    logger.info('ServiceService: Updating service under category', { serviceId, categoryId, storeId, userId, updateData });
    return await Service.updateServiceUnderCategory(serviceId, updateData, categoryId, storeId, userId);
  }

  async deleteServiceUnderCategory(serviceId, categoryId, storeId, userId) {
    logger.info('ServiceService: Deleting service under category', { serviceId, categoryId, storeId, userId });
    return await Service.deleteServiceUnderCategory(serviceId, categoryId, storeId, userId);
  }

  async getCategoriesWithServices(storeId, userId) {
  logger.info("ServiceService: Fetching categories with services", { storeId, userId });
  return await Service.getCategoriesWithServices(storeId, userId);
}
}

module.exports = new ServiceService();

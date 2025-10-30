const Service = require('../models/Service');
const logger = require('../utils/logger');

class ServiceService {
  async createService(serviceData) {
    logger.info('ServiceService: Creating service', { storeId: serviceData.storeId });
    return await Service.createService(serviceData);
  }

  async getServicesByStore(storeId, userId, options = {}) {
    logger.info('ServiceService: Getting services by store', { storeId, userId, options });
    return await Service.getServicesByStore(storeId, userId, options);
  }

  async getServiceById(serviceId, storeId, userId) {
    logger.info('ServiceService: Getting service by ID', { serviceId, storeId, userId });
    return await Service.getServiceById(serviceId, storeId, userId);
  }

  async updateService(serviceId, updateData, storeId, userId) {
    logger.info('ServiceService: Updating service', { serviceId, storeId, userId, updateData });
    return await Service.updateService(serviceId, updateData, storeId, userId);
  }

  async deleteService(serviceId, storeId, userId) {
    logger.info('ServiceService: Deleting service', { serviceId, storeId, userId });
    return await Service.deleteService(serviceId, storeId, userId);
  }

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
}

module.exports = new ServiceService();

const Store = require("../models/Store");

class StoreService {
  async createStore(storeData) {
    try {
      return await Store.createStore(storeData);
    } catch (error) {
      throw error;
    }
  }

  async getStoresByUser(userId, options = {}) {
    try {
      return await Store.getStoresByUser(userId, options);
    } catch (error) {
      throw error;
    }
  }

  async getStoreById(storeId, userId, companyId) {
    try {
      return await Store.getStoreById(storeId, userId, companyId);
    } catch (error) {
      throw error;
    }
  }

  async updateStore(storeId, updateData, userId, companyId) {
    try {
      return await Store.updateStore(storeId, updateData, userId, companyId);
    } catch (error) {
      throw error;
    }
  }

  async deleteStore(storeId, userId, companyId) {
    try {
      return await Store.deleteStore(storeId, userId, companyId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StoreService();

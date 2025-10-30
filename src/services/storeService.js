const Store = require('../models/Store');

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

  async getStoreById(storeId, userId) {
    try {
      return await Store.getStoreById(storeId, userId);
    } catch (error) {
      throw error;
    }
  }

  async updateStore(storeId, updateData, userId) {
    try {
      return await Store.updateStore(storeId, updateData, userId);
    } catch (error) {
      throw error;
    }
  }

  async deleteStore(storeId, userId) {
    try {
      return await Store.deleteStore(storeId, userId);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new StoreService();

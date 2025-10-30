const storeService = require('../services/storeService');
const { sendSuccess, sendError } = require('../utils/response');

class StoreController {
  // Create Store for a User
  async createStore(req, res, next) {
    try {
      const { userId } = req.params;
      const { name, areaOfWork, teamSize, date, signature } = req.body;

      const storeData = {
        name,
        areaOfWork,
        teamSize,
        date,
        signature,
        userId,
      };

      const store = await storeService.createStore(storeData);

      return sendSuccess(res, 'Store created successfully', {
        userId,
        storeId: store.id,
        name: store.name,
        areaOfWork: store.areaOfWork,
        teamSize: store.teamSize,
        date: store.date,
        signature: store.signature,
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  // Get All Stores of a User
  async getStoresByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100), // Max 100 items per page
      };

      const result = await storeService.getStoresByUser(userId, options);

      const formattedStores = result.stores.map(store => ({
        storeId: store.id,
        userId,
        name: store.name,
        areaOfWork: store.areaOfWork,
        teamSize: store.teamSize,
        date: store.date,
        signature: store.signature,
      }));

      return sendSuccess(res, 'All stores fetched successfully', {
        userId,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        stores: formattedStores,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Single Store
  async getStoreById(req, res, next) {
    try {
      const { userId, storeId } = req.params;

      const store = await storeService.getStoreById(storeId, userId);

      return sendSuccess(res, 'Store fetched successfully', {
        store: {
          storeId: store.id,
          userId,
          name: store.name,
          areaOfWork: store.areaOfWork,
          teamSize: store.teamSize,
          date: store.date,
          signature: store.signature,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Store
  async updateStore(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const updateData = req.body;

      const store = await storeService.updateStore(storeId, updateData, userId);

      return sendSuccess(res, 'Store updated successfully', {
        store: {
          storeId: store.id,
          userId,
          name: store.name,
          areaOfWork: store.areaOfWork,
          teamSize: store.teamSize,
          date: store.date,
          signature: store.signature,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete Store
  async deleteStore(req, res, next) {
    try {
      const { userId, storeId } = req.params;

      const result = await storeService.deleteStore(storeId, userId);

      return sendSuccess(res, 'Store deleted successfully', {
        message: 'Store deleted successfully',
        storeId: result.storeId,
        userId: result.userId,
      }, 204);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();

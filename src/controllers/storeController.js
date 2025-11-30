const storeService = require("../services/storeService");
const { sendSuccess, sendError } = require("../utils/response");

class StoreController {
  // CREATE STORE
  async createStore(req, res, next) {
    try {
      const { userId } = req.params;
      const { name, areaOfWork, teamSize, date, signature, companyId } =
        req.body;

      if (!companyId) {
        return sendError(res, "companyId is required", 400);
      }

      const storeData = {
        name,
        areaOfWork,
        teamSize,
        date,
        signature,
        userId,
        companyId, // ✅ Store belongs to a company now
      };

      const store = await storeService.createStore(storeData);

      return sendSuccess(
        res,
        "Store created successfully",
        {
          storeId: store.id,
          userId: store.userId,
          companyId: store.companyId,
          name: store.name,
          areaOfWork: store.areaOfWork,
          teamSize: store.teamSize,
          date: store.date,
          signature: store.signature,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  //  GET ALL STORES BY USER (company-scoped)
  async getStoresByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { companyId } = req.params;

      console.log(">>>>>>>><<<<<", companyId, ">>>>>>>><<<<<");

      const { page = 1, limit = 20 } = req.query;

      if (!companyId) {
        return sendError(res, "companyId is required", 400);
      }

      const options = {
        page: parseInt(page),
        limit: Math.min(parseInt(limit), 100),
      };

      const result = await storeService.getStoresByUser(
        userId,
        companyId,
        options
      );

      const formattedStores = result.stores.map((store) => ({
        storeId: store.id,
        companyId: store.companyId,
        userId,
        name: store.name,
        areaOfWork: store.areaOfWork,
        teamSize: store.teamSize,
        date: store.date,
        signature: store.signature,
      }));

      return sendSuccess(res, "All stores fetched successfully", {
        userId,
        companyId,
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        stores: formattedStores,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET SINGLE STORE
  async getStoreById(req, res, next) {
    try {
      const { userId, companyId, storeId } = req.params;

      if (!companyId) {
        return sendError(res, "companyId is required", 400);
      }

      const store = await storeService.getStoreById(storeId, userId, companyId);

      return sendSuccess(res, "Store fetched successfully", {
        store: {
          storeId: store.id,
          companyId: store.companyId,
          managerId: store.managerId, // 🔥 correct field name
          name: store.name,
          areaOfWork: store.areaOfWork,
          teamSize: store.teamSize,
          date: store.date,
          signature: store.signature,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // UPDATE STORE
 async updateStore(req, res, next) {
  try {
    const { userId, companyId, storeId } = req.params;
    const updateData = req.body;

    const store = await storeService.updateStore(
      storeId,
      updateData,
      userId,
      companyId
    );

    return sendSuccess(res, "Store updated successfully", {
      store: {
        storeId: store.id,
        companyId: store.companyId,
        managerId: store.managerId,
        name: store.name,
        areaOfWork: store.areaOfWork,
        teamSize: store.teamSize,
        date: store.date,
        signature: store.signature,
      },
    });

  } catch (error) {
    next(error);
  }
}


  // DELETE STORE
  async deleteStore(req, res, next) {
    try {
      const { userId, companyId, storeId } = req.params;

      if (!companyId) {
        return sendError(res, "companyId is required", 400);
      }

      const result = await storeService.deleteStore(storeId, userId, companyId);

      return sendSuccess(
        res,
        "Store deleted successfully",
        {
          storeId: result.storeId,
          userId: result.userId,
          companyId: result.companyId,
        },
        204
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StoreController();

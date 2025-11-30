// Custom Store Model - Business Logic Layer
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class Store {
  // Business validation rules
  static validateName(name) {
    if (!name || name.trim().length < 1) {
      throw new Error("Store name is required");
    }
    if (name.trim().length > 100) {
      throw new Error("Store name must be less than 100 characters");
    }
    return true;
  }

  static validateAreaOfWork(areaOfWork) {
    if (!areaOfWork || areaOfWork.trim().length < 1) {
      throw new Error("Area of work is required");
    }
    if (areaOfWork.trim().length > 50) {
      throw new Error("Area of work must be less than 50 characters");
    }
    return true;
  }

  static validateTeamSize(teamSize) {
    if (teamSize === undefined || teamSize === null) {
      throw new Error("Team size is required");
    }
    if (!Number.isInteger(teamSize) || teamSize < 1) {
      throw new Error("Team size must be a positive integer");
    }
    if (teamSize > 1000) {
      throw new Error("Team size must be less than 1000");
    }
    return true;
  }

  static validateDate(date) {
    if (!date || date.trim().length < 1) {
      throw new Error("Date is required");
    }
    // Validate DD-MM-YYYY format
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error("Date must be in DD-MM-YYYY format");
    }
    return true;
  }

  static validateSignature(signature) {
    if (!signature || signature.trim().length < 1) {
      throw new Error("Signature is required");
    }
    if (signature.trim().length > 200) {
      throw new Error("Signature must be less than 200 characters");
    }
    return true;
  }

  // Business logic for store creation
  static async createStore(storeData) {
    const { name, areaOfWork, teamSize, date, signature, userId, companyId } =
      storeData;

    this.validateName(name);
    this.validateAreaOfWork(areaOfWork);
    this.validateTeamSize(teamSize);
    this.validateDate(date);
    this.validateSignature(signature);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User not found");
    if (!user.isActive) throw new Error("User account is deactivated");

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        areaOfWork: areaOfWork.trim(),
        teamSize: parseInt(teamSize),
        date: date.trim(),
        signature: signature.trim(),

        company: {
          connect: { id: companyId },
        },

        manager: {
          connect: { id: userId },
        },
      },
      select: {
        id: true,
        name: true,
        areaOfWork: true,
        teamSize: true,
        date: true,
        signature: true,
        companyId: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return store;
  }

  // Business logic for getting stores by user with pagination
  static async getStoresByUser(userId, companyId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const [stores, totalCount] = await Promise.all([
      prisma.store.findMany({
        where: {
          managerId: userId,
          companyId: companyId,
        },
        select: {
          id: true,
          name: true,
          areaOfWork: true,
          teamSize: true,
          date: true,
          signature: true,
          managerId: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.store.count({
        where: {
          managerId: userId,
          companyId: companyId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      stores,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // Business logic for getting a single store
  static async getStoreById(storeId, userId, companyId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        managerId: userId,
        companyId: companyId,
      },
      select: {
        id: true,
        name: true,
        areaOfWork: true,
        teamSize: true,
        date: true,
        signature: true,
        managerId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!store) {
      throw new Error("Store not found");
    }

    return store;
  }

  // Business logic for updating a store
  static async updateStore(storeId, updateData, userId, companyId) {
    if (updateData.name !== undefined) {
      this.validateName(updateData.name);
      updateData.name = updateData.name.trim();
    }
    if (updateData.areaOfWork !== undefined) {
      this.validateAreaOfWork(updateData.areaOfWork);
      updateData.areaOfWork = updateData.areaOfWork.trim();
    }
    if (updateData.teamSize !== undefined) {
      this.validateTeamSize(updateData.teamSize);
      updateData.teamSize = parseInt(updateData.teamSize);
    }
    if (updateData.date !== undefined) {
      this.validateDate(updateData.date);
      updateData.date = updateData.date.trim();
    }
    if (updateData.signature !== undefined) {
      this.validateSignature(updateData.signature);
      updateData.signature = updateData.signature.trim();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        managerId: userId,
        companyId: companyId,
      },
    });

    if (!existingStore) {
      throw new Error("Store not found");
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
      select: {
        id: true,
        name: true,
        areaOfWork: true,
        teamSize: true,
        date: true,
        signature: true,
        managerId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return store;
  }

  // Business logic for deleting a store
  static async deleteStore(storeId, userId, companyId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const existingStore = await prisma.store.findFirst({
      where: {
        id: storeId,
        managerId: userId,
        companyId: companyId,
      },
    });

    if (!existingStore) {
      throw new Error("Store not found");
    }

    await prisma.store.delete({
      where: {
        id: storeId,
      },
    });

    return {
      storeId,
      managerId: userId,
      companyId,
    };
  }
}

module.exports = Store;

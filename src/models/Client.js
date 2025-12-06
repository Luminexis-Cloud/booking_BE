// Custom Client Model - Business Logic Layer
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

class Client {
  // Business validation rules
  static validateEmail(email) {
    if (!email) return true; // Optional field

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }
    return true;
  }

  static validatePhone(phone) {
    if (!phone || phone.trim().length === 0) {
      throw new Error("Client phone is required");
    }

    // Basic phone number validation (adjust regex as needed)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error("Invalid phone number format");
    }
    return true;
  }

  static validateName(name) {
    if (!name || name.trim().length === 0) {
      throw new Error("Client name is required");
    }
    if (name.length > 100) {
      throw new Error("Client name must be less than 100 characters");
    }
    return true;
  }

  static validateBirthday(birthday) {
    if (!birthday) return true; // Optional field

    const birthdayDate = new Date(birthday);
    if (isNaN(birthdayDate.getTime())) {
      throw new Error("Invalid birthday format");
    }

    const today = new Date();
    if (birthdayDate > today) {
      throw new Error("Birthday cannot be in the future");
    }

    return true;
  }

  // Helper method to validate store ownership
  static async validateStoreOwnership(storeId, userId) {
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        managerId: userId,
      },
    });

    if (!store) {
      throw new Error("Store not found or access denied");
    }

    return store;
  }

  // Business logic for client creation under store
  // CREATE CLIENT UNDER STORE
  static async createClient(storeId, userId, clientData) {
    const { name, phone, email, notes, birthday, isActive = true } = clientData;

    // VALIDATION
    this.validateName(name);
    this.validatePhone(phone);
    this.validateEmail(email);

    if (birthday !== "" && birthday !== null && birthday !== undefined) {
      this.validateBirthday(birthday);
    }

    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Duplicate EMAIL check
    if (email) {
      const existingClientByEmail = await prisma.client.findFirst({
        where: { email, storeId },
      });
      if (existingClientByEmail) {
        throw new Error("Client with this email already exists for this store");
      }
    }

    // Duplicate PHONE check
    const existingClientByPhone = await prisma.client.findFirst({
      where: { phone, storeId },
    });
    if (existingClientByPhone) {
      throw new Error(
        "Client with this phone number already exists for this store"
      );
    }

    // CREATE CLIENT
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        notes: notes?.trim() || null,
        birthday: birthday ? new Date(birthday) : null,
        information: [], // ALWAYS empty on create
        isActive,
        userId,
        storeId,
      },
      select: {
        id: true,
        clientId: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        birthday: true,
        information: true,
        isActive: true,
        userId: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return client;
  }

  // Business logic for getting all clients for a user
  static async getClientsByUserId(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId },
        select: {
          id: true,
          clientId: true,
          name: true,
          phone: true,
          email: true,
          notes: true,
          birthday: true,
          information: true,
          isActive: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.client.count({
        where: { userId },
      }),
    ]);

    return {
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Business logic for getting a single client
  static async getClientById(clientId, userId) {
    const client = await prisma.client.findFirst({
      where: {
        clientId,
        userId,
      },
      select: {
        id: true,
        clientId: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        birthday: true,
        information: true,
        isActive: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
  }

  // Business logic for deleting client
  static async deleteClient(clientId, userId) {
    // Check if client exists
    const existingClient = await prisma.client.findFirst({
      where: {
        clientId,
        userId,
      },
    });

    if (!existingClient) {
      throw new Error("Client not found");
    }

    // Delete client
    await prisma.client.delete({
      where: { clientId },
    });

    return {
      clientId,
      userId,
    };
  }

  // ====== STORE-BASED CLIENT METHODS ======

  // Business logic for getting all clients under a store
  static async getClientsByStore(storeId, userId, page = 1, limit = 20) {
    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { storeId },
        select: {
          id: true,
          clientId: true,
          name: true,
          phone: true,
          email: true,
          notes: true,
          birthday: true,
          isActive: true,
          information: true,
          userId: true,
          storeId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.client.count({
        where: { storeId },
      }),
    ]);

    return {
      clients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Business logic for getting a single client under a store
  static async getClientByIdUnderStore(clientId, storeId, userId) {
    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    const client = await prisma.client.findFirst({
      where: {
        clientId,
        storeId,
      },
      select: {
        id: true,
        clientId: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        birthday: true,
        information: true,
        isActive: true,
        userId: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    return client;
  }

  // Business logic for updating client under store
  // Business logic for updating client
  static async updateClientUnderStore(clientId, storeId, userId, updateData) {
    console.log(
      "Chart entries from single client:",
      clientId,
      storeId,
      userId,
      updateData
    );

    console.log("Check ownership:", storeId, userId);
    await this.validateStoreOwnership(storeId, userId);
    console.log("Ownership OK");

    // 2. Field validations
    if (updateData.name) this.validateName(updateData.name);
    if (updateData.phone) this.validatePhone(updateData.phone);
    if (updateData.email) this.validateEmail(updateData.email);

    if (
      updateData.birthday !== "" &&
      updateData.birthday !== null &&
      updateData.birthday !== undefined
    ) {
      this.validateBirthday(updateData.birthday);
    }

    // 3. Find the existing client
    const existingClient = await prisma.client.findFirst({
      where: { clientId, storeId },
    });

    console.log("Found client:", JSON.stringify(existingClient, null, 2));

    if (!existingClient) throw new Error("Client not found");

    // 4. Duplicate email check
    if (updateData.email && updateData.email !== existingClient.email) {
      const existingEmail = await prisma.client.findFirst({
        where: {
          email: updateData.email,
          storeId,
          NOT: { clientId },
        },
      });
      if (existingEmail) {
        throw new Error("Client with this email already exists for this store");
      }
    }

    // 5. Duplicate phone check
    if (updateData.phone && updateData.phone !== existingClient.phone) {
      const existingPhone = await prisma.client.findFirst({
        where: {
          phone: updateData.phone,
          storeId,
          NOT: { clientId },
        },
      });
      if (existingPhone) {
        throw new Error(
          "Client with this phone number already exists for this store"
        );
      }
    }

    // 6. Prepare updatePayload
    const updatePayload = {};

    if (updateData.name) updatePayload.name = updateData.name.trim();
    if (updateData.phone) updatePayload.phone = updateData.phone.trim();
    if (updateData.email !== undefined)
      updatePayload.email = updateData.email?.trim() || null;
    if (updateData.notes !== undefined)
      updatePayload.notes = updateData.notes?.trim() || null;

    updatePayload.birthday =
      updateData.birthday === undefined || updateData.birthday === ""
        ? existingClient.birthday
        : new Date(updateData.birthday);

    const { v4: uuidv4 } = require("uuid");

    const existingList = existingClient.information || [];
    console.log("Existing information in DB:", existingClient.information);

    // ⭐ Merge new data
    if (Array.isArray(updateData.information)) {
      const incomingList = updateData.information;

      const updatedList = incomingList.map((newItem) => {
        const id =
          newItem.id &&
          typeof newItem.id === "string" &&
          newItem.id.trim() !== ""
            ? newItem.id
            : uuidv4(); // backend assigns ID for new item

        const index = existingList.findIndex((oldItem) => oldItem.id === id);

        if (index !== -1) {
          // update existing
          return {
            ...safeExistingList[index],
            ...newItem,
            id,
          };
        }

        // new item
        return {
          ...newItem,
          id,
        };
      });

      updatePayload.information = updatedList;
    }

    // isActive toggle
    if (updateData.isActive !== undefined) {
      updatePayload.isActive = updateData.isActive;
    }

    // Update
    await prisma.client.update({
      where: {
        clientId_storeId: {
          clientId,
          storeId,
        },
      },
      data: updatePayload,
    });

    return prisma.client.findFirst({
      where: { clientId, storeId },
      select: {
        id: true,
        clientId: true,
        name: true,
        phone: true,
        email: true,
        notes: true,
        birthday: true,
        information: true,
        isActive: true,
        userId: true,
        storeId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Business logic for deleting client under store
  static async deleteClientUnderStore(clientId, storeId, userId) {
    // Validate store ownership
    await this.validateStoreOwnership(storeId, userId);

    // Check if client exists
    const existingClient = await prisma.client.findFirst({
      where: {
        clientId,
        storeId,
      },
    });

    if (!existingClient) {
      throw new Error("Client not found");
    }

    // Delete client
    await prisma.client.delete({
      where: { clientId },
    });

    return {
      clientId,
      storeId,
      userId,
    };
  }
}

module.exports = Client;

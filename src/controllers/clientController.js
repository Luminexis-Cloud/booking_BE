const clientService = require("../services/clientService");

// Helper function to replace null with empty string
function replaceNullWithEmptyString(value) {
  return value === null || value === undefined ? "" : value;
}

class ClientController {
  // Create a new client
  async createClient(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const clientData = req.body;
      
      const client = await clientService.createClient(
        storeId,
        userId,
        clientData
      );

      res.status(201).json({
        message: "Client created successfully",
        client: {
          clientId: client.clientId,
          userId: client.userId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          isActive: client.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all clients for a user
  async getClients(req, res, next) {
    try {
      const userId = req.params.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await clientService.getClientsByUserId(
        userId,
        page,
        limit
      );

      res.status(200).json({
        message: "All clients fetched successfully",
        userId,
        page: result.page,
        limit: result.limit,
        total: result.total,
        clients: result.clients.map((client) => ({
          clientId: client.clientId,
          userId: client.userId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          isActive: client.isActive,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single client
  async getClient(req, res, next) {
    try {
      const userId = req.params.userId;
      const clientId = req.params.clientId;

      const client = await clientService.getClientById(clientId, userId);

      res.status(200).json({
        message: "Client fetched successfully",
        client: {
          clientId: client.clientId,
          userId: client.userId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          isActive: client.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a client
  async updateClient(req, res, next) {
    try {
      const userId = req.params.userId;
      const clientId = req.params.clientId;
      const updateData = req.body;

      const client = await clientService.updateClient(
        clientId,
        userId,
        updateData
      );

      res.status(200).json({
        message: "Client updated successfully",
        client: {
          clientId: client.clientId,
          userId: client.userId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          isActive: client.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a client
  async deleteClient(req, res, next) {
    try {
      const userId = req.params.userId;
      const clientId = req.params.clientId;

      const result = await clientService.deleteClient(clientId, userId);

      res.status(200).json({
        message: "Client deleted successfully",
        clientId: result.clientId,
        userId: result.userId,
      });
    } catch (error) {
      next(error);
    }
  }

  // ====== STORE-BASED CLIENT CONTROLLERS ======

  // Create a new client under a store
  async createClientUnderStore(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const clientData = req.body;

      const client = await clientService.createClientUnderStore(
        storeId,
        userId,
        clientData
      );

      // Format information - if empty array, return empty object structure
      let formattedInformation = client.information;
      if (
        !formattedInformation ||
        (Array.isArray(formattedInformation) &&
          formattedInformation.length === 0)
      ) {
        formattedInformation = [
          {
            note: "",
            image: [],
            date: "",
          },
        ];
      } else if (Array.isArray(formattedInformation)) {
        // Replace null with empty string in information items
        formattedInformation = formattedInformation.map((item) => ({
          note: item.note === null ? "" : item.note,
          image: item.image || [],
          date: item.date === null ? "" : item.date,
        }));
      }

      res.status(201).json({
        message: "Client created successfully",
        client: {
          clientId: client.clientId,
          userId: client.userId,
          storeId: client.storeId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          information: formattedInformation,
          isActive: client.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all clients under a store
  async getClientsUnderStore(req, res, next) {
    try {
      const { userId, storeId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await clientService.getClientsByStore(
        storeId,
        userId,
        page,
        limit
      );

      // Format information - if empty array, return empty object structure
      const formatInformation = (info) => {
        if (!info || (Array.isArray(info) && info.length === 0)) {
          return [
            {
              note: "",
              image: [],
              date: "",
            },
          ];
        }
        // Replace null with empty string in information items
        return Array.isArray(info)
          ? info.map((item) => ({
              note: item.note === null ? "" : item.note,
              image: item.image || [],
              date: item.date === null ? "" : item.date,
            }))
          : info;
      };

      res.status(200).json({
        message: "All clients fetched successfully",
        userId,
        storeId,
        page: result.page,
        limit: result.limit,
        total: result.total,
        clients: result.clients.map((client) => ({
          clientId: client.clientId,
          userId: client.userId,
          storeId: client.storeId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          information: formatInformation(client.information),
          isActive: client.isActive,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a single client under a store
  async getClientUnderStore(req, res, next) {
    try {
      const { userId, storeId, clientId } = req.params;

      const client = await clientService.getClientByIdUnderStore(
        clientId,
        storeId,
        userId
      );

      // Format information - if empty array, return empty object structure
      let formattedInformation = client.information;
      if (
        !formattedInformation ||
        (Array.isArray(formattedInformation) &&
          formattedInformation.length === 0)
      ) {
        formattedInformation = [
          {
            note: "",
            image: [],
            date: "",
          },
        ];
      } else if (Array.isArray(formattedInformation)) {
        // Replace null with empty string in information items
        formattedInformation = formattedInformation.map((item) => ({
          note: item.note === null ? "" : item.note,
          image: item.image || [],
          date: item.date === null ? "" : item.date,
        }));
      }

      res.status(200).json({
        message: "Client fetched successfully",
        client: {
          clientId: client.clientId,
          userId: client.userId,
          storeId: client.storeId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          information: formattedInformation,
          isActive: client.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a client under a store
  async updateClientUnderStore(req, res, next) {
    try {
      const { userId, storeId, clientId } = req.params;
      const updateData = req.body;

      const client = await clientService.updateClientUnderStore(
        clientId,
        storeId,
        userId,
        updateData
      );

      // Format information - if empty array, return empty object structure
      let formattedInformation = client.information;
      if (
        !formattedInformation ||
        (Array.isArray(formattedInformation) &&
          formattedInformation.length === 0)
      ) {
        formattedInformation = [
          {
            note: "",
            image: [],
            date: "",
          },
        ];
      } else if (Array.isArray(formattedInformation)) {
        // Replace null with empty string in information items
        formattedInformation = formattedInformation.map((item) => ({
          note: item.note === null ? "" : item.note,
          image: item.image || [],
          date: item.date === null ? "" : item.date,
        }));
      }

      res.status(200).json({
        message: "Client updated successfully",
        client: {
          clientId: client.clientId,
          userId: client.userId,
          storeId: client.storeId,
          name: client.name,
          phone: client.phone,
          email: replaceNullWithEmptyString(client.email),
          notes: replaceNullWithEmptyString(client.notes),
          birthday: replaceNullWithEmptyString(client.birthday),
          information: formattedInformation,
          isActive: client.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a client under a store
  async deleteClientUnderStore(req, res, next) {
    try {
      const { userId, storeId, clientId } = req.params;

      const result = await clientService.deleteClientUnderStore(
        clientId,
        storeId,
        userId
      );

      res.status(204).json({
        message: "Client deleted successfully",
        clientId: result.clientId,
        storeId: result.storeId,
        userId: result.userId,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();

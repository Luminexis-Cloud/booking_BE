const Client = require("../models/Client");

class ClientService {
  async createClient(storeId, userId, clientData) {
  return await Client.createClient(storeId, userId, clientData);
}

  async getClientsByUserId(userId, page = 1, limit = 1000) {
    return await Client.getClientsByUserId(userId, page, limit);
  }

  async getClientById(clientId, userId) {
    return await Client.getClientById(clientId, userId);
  }

  async updateClient(clientId, userId, updateData) {
    return await Client.updateClient(clientId, userId, updateData);
  }

  async deleteClient(clientId, userId) {
    return await Client.deleteClient(clientId, userId);
  }

  // Store-based client methods
  async createClientUnderStore(storeId, userId, clientData) {
    return await Client.createClient(storeId, userId, clientData);
  }

  async getClientsByStore(storeId, userId, page = 1, limit = 20) {
    return await Client.getClientsByStore(storeId, userId, page, limit);
  }

  async getClientByIdUnderStore(clientId, storeId, userId) {
    return await Client.getClientByIdUnderStore(clientId, storeId, userId);
  }

  async updateClientUnderStore(clientId, storeId, userId, updateData) {
    return await Client.updateClientUnderStore(
      clientId,
      storeId,
      userId,
      updateData
    );
  }

  async deleteClientUnderStore(clientId, storeId, userId) {
    return await Client.deleteClientUnderStore(clientId, storeId, userId);
  }
}

module.exports = new ClientService();

/**
 * SSE Service Manager (Singleton)
 * Maintains active connections for both Admin and ERP Users
 */
class SSEService {
  constructor() {
    this.cadminClients = new Map(); // Map<cadminId, Set<Response>>
    this.userClients = new Map();   // Map<userId, Set<Response>>
  }

  // --- CAdmin Management ---
  addCAdminClient(cadminId, res) {
    if (!this.cadminClients.has(cadminId)) {
      this.cadminClients.set(cadminId, new Set());
    }
    this.cadminClients.get(cadminId).add(res);
  }

  removeCAdminClient(cadminId, res) {
    const clients = this.cadminClients.get(cadminId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.cadminClients.delete(cadminId);
    }
  }

  notifyCAdmin(cadminId, eventName, data) {
    const clients = this.cadminClients.get(cadminId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach(res => {
      try {
        res.write(message);
      } catch (err) {
        this.removeCAdminClient(cadminId, res);
      }
    });
  }

  // --- User Management ---
  addUserClient(userId, res) {
    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set());
    }
    this.userClients.get(userId).add(res);
  }

  removeUserClient(userId, res) {
    const clients = this.userClients.get(userId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.userClients.delete(userId);
    }
  }

  notifyUser(userId, eventName, data) {
    const clients = this.userClients.get(userId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach(res => {
      try {
        res.write(message);
      } catch (err) {
        this.removeUserClient(userId, res);
      }
    });
  }

  // --- Helpers ---
  formatSSEMessage(eventName, data) {
    return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  }
}

export const sseService = new SSEService();
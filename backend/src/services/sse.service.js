// backend/src/services/sse.service.js

/**
 * SSE Service Manager (Singleton)
 * Maintains active connections for CAdmin, ERP Users, and Mobile Customers.
 */
class SSEService {
  constructor() {
    this.cadminClients = new Map(); // Map<cadminId, Set<Response>>
    this.userClients   = new Map(); // Map<userId,   Set<Response>>
    this.mobileClients = new Map(); // Map<customerId, Set<Response>>
  }

  // ── CAdmin ────────────────────────────────────────────────────────────────

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
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeCAdminClient(cadminId, res);
      }
    });
  }

  // ── ERP Users ─────────────────────────────────────────────────────────────

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
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeUserClient(userId, res);
      }
    });
  }

  // ── Mobile Customers ──────────────────────────────────────────────────────

  addMobileClient(customerId, res) {
    if (!this.mobileClients.has(customerId)) {
      this.mobileClients.set(customerId, new Set());
    }
    this.mobileClients.get(customerId).add(res);
  }

  removeMobileClient(customerId, res) {
    const clients = this.mobileClients.get(customerId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) this.mobileClients.delete(customerId);
    }
  }

  notifyMobile(customerId, eventName, data) {
    const clients = this.mobileClients.get(customerId);
    if (!clients) return;
    const message = this.formatSSEMessage(eventName, data);
    clients.forEach((res) => {
      try {
        res.write(message);
      } catch {
        this.removeMobileClient(customerId, res);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatSSEMessage(eventName, data) {
    return `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  }
}

export const sseService = new SSEService();
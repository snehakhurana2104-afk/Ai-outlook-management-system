/**
 * Enhanced Socket.IO Service
 * Real-time updates, notifications, and sync status
 */

import io from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

class SocketService {
  constructor() {
    this.listeners = {};
    this.isConnected = false;
  }

  // ======================================
  // Connection Management
  // ======================================

  connect() {
    if (socket?.connected) {
      console.log('✅ Socket already connected');
      return socket;
    }

    console.log(`🔗 Connecting to Socket.IO: ${SOCKET_URL}`);

    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      credentials: true,
    });

    // Connection events
    socket.on('connect', () => {
      this.isConnected = true;
      reconnectAttempts = 0;
      console.log('✅ Connected to Socket.IO:', socket.id);
      this.emit('connected', { socketId: socket.id });
    });

    socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Disconnected from Socket.IO:', reason);
      this.emit('disconnected', { reason });
    });

    socket.on('reconnect_attempt', () => {
      reconnectAttempts++;
      console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket Error:', error);
      this.emit('error', error);
    });

    // ======================================
    // Email Events
    // ======================================

    socket.on('new-email', (data) => {
      console.log('📧 New email received:', data.email.subject);
      this.emit('new-email', data);
    });

    socket.on('email-status-changed', (data) => {
      console.log('🔄 Email status changed:', data.emailId, data.newStatus);
      this.emit('email-status-changed', data);
    });

    socket.on('email-updated', (data) => {
      console.log('✏️ Email updated:', data.email.subject);
      this.emit('email-updated', data);
    });

    socket.on('email-deleted', (data) => {
      console.log('🗑️ Email deleted:', data.emailId);
      this.emit('email-deleted', data);
    });

    // ======================================
    // Task Events
    // ======================================

    socket.on('new-task', (data) => {
      console.log('✅ New task created:', data.task.title);
      this.emit('new-task', data);
    });

    socket.on('task-updated', (data) => {
      console.log('🔄 Task updated:', data.task.title);
      this.emit('task-updated', data);
    });

    socket.on('task-completed', (data) => {
      console.log('✔️ Task completed:', data.taskId);
      this.emit('task-completed', data);
    });

    socket.on('task-deleted', (data) => {
      console.log('🗑️ Task deleted:', data.taskId);
      this.emit('task-deleted', data);
    });

    // ======================================
    // Sync Events
    // ======================================

    socket.on('sync-started', (data) => {
      console.log('🔄 Sync started');
      this.emit('sync-started', data);
    });

    socket.on('sync-completed', (data) => {
      console.log('✅ Sync completed');
      this.emit('sync-completed', data);
    });

    socket.on('sync-error', (data) => {
      console.error('❌ Sync error:', data.error);
      this.emit('sync-error', data);
    });

    socket.on('sync-status', (data) => {
      console.log('📊 Sync status:', data);
      this.emit('sync-status', data);
    });

    // ======================================
    // Dashboard Events
    // ======================================

    socket.on('dashboard-updated', (data) => {
      console.log('📊 Dashboard updated');
      this.emit('dashboard-updated', data);
    });

    socket.on('stats-updated', (data) => {
      console.log('📈 Stats updated');
      this.emit('stats-updated', data);
    });

    // ======================================
    // Notifications
    // ======================================

    socket.on('notification', (data) => {
      console.log('🔔 Notification:', data.title);
      this.emit('notification', data);
    });

    socket.on('high-priority-alert', (data) => {
      console.log('⚠️ High priority alert:', data.email.subject);
      this.emit('high-priority-alert', data);
    });

    socket.on('task-reminder', (data) => {
      console.log('⏰ Task reminder:', data.task.title);
      this.emit('task-reminder', data);
    });

    // ======================================
    // AI Events
    // ======================================

    socket.on('ai-reply-generated', (data) => {
      console.log('🤖 AI reply generated');
      this.emit('ai-reply-generated', data);
    });

    socket.on('ai-analysis-complete', (data) => {
      console.log('🤖 AI analysis complete');
      this.emit('ai-analysis-complete', data);
    });

    return socket;
  }

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
      this.isConnected = false;
      console.log('🔌 Socket disconnected');
    }
  }

  // ======================================
  // Event Management
  // ======================================

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback
      );
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  // ======================================
  // Client-Initiated Events
  // ======================================

  requestSync() {
    if (socket?.connected) {
      socket.emit('request-sync');
      console.log('📤 Sync requested');
    } else {
      console.warn('⚠️ Socket not connected');
    }
  }

  requestEmailRefresh(filter = {}) {
    if (socket?.connected) {
      socket.emit('request-email-refresh', filter);
      console.log('🔄 Email refresh requested');
    }
  }

  requestStatsUpdate() {
    if (socket?.connected) {
      socket.emit('request-stats-update');
      console.log('📊 Stats update requested');
    }
  }

  // ======================================
  // Status Checks
  // ======================================

  getConnectionStatus() {
    return {
      connected: socket?.connected || false,
      socketId: socket?.id,
    };
  }

  isSocketConnected() {
    return this.isConnected && socket?.connected;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

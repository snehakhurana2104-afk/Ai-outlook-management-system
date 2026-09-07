/**
 * Enhanced Socket.IO Event Gateway
 * Real-time email sync, task updates, and notifications
 */

const { Server } = require("socket.io");

let io;
let syncStatus = {
  isSyncing: false,
  lastSyncTime: null,
  lastSyncStatus: "idle",
  syncError: null,
  connectedClients: 0,
};

const initializeGateway = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  io.on("connection", (socket) => {
    syncStatus.connectedClients = io.engine.clientsCount;
    console.log(`✅ Client Connected: ${socket.id} (Total: ${syncStatus.connectedClients})`);

    // Send current sync status to client
    socket.emit("sync-status", syncStatus);

    // ==========================================
    // Client-initiated events
    // ==========================================

    socket.on("request-sync", async () => {
      console.log(`📤 Sync requested by client: ${socket.id}`);
      socket.emit("sync-started");
      
      // Emit to all clients about sync
      io.emit("sync-status", {
        ...syncStatus,
        isSyncing: true,
        lastSyncStatus: "in_progress",
      });
    });

    socket.on("request-email-refresh", (data) => {
      console.log(`🔄 Email refresh requested:`, data);
      io.emit("email-refresh-requested", data);
    });

    socket.on("request-stats-update", () => {
      console.log(`📊 Stats update requested by ${socket.id}`);
      io.emit("stats-update-requested");
    });

    socket.on("disconnect", () => {
      syncStatus.connectedClients = io.engine.clientsCount;
      console.log(`❌ Client Disconnected: ${socket.id} (Total: ${syncStatus.connectedClients})`);
    });

    socket.on("error", (error) => {
      console.error(`❌ Socket Error from ${socket.id}:`, error);
    });
  });

  return io;
};

// ============================
// 1. EMAIL EVENTS
// ============================

const emitNewEmail = (email) => {
  if (!io) return;
  console.log(`📧 Broadcasting new email: ${email.subject}`);
  io.emit("new-email", {
    email,
    timestamp: new Date(),
  });
};

const emitEmailStatusChange = (emailId, newStatus, changes) => {
  if (!io) return;
  console.log(`🔄 Email status changed: ${emailId} -> ${newStatus}`);
  io.emit("email-status-changed", {
    emailId,
    newStatus,
    changes,
    timestamp: new Date(),
  });
};

const emitEmailUpdated = (email) => {
  if (!io) return;
  console.log(`✏️ Email updated: ${email.subject}`);
  io.emit("email-updated", {
    email,
    timestamp: new Date(),
  });
};

const emitEmailDeleted = (emailId) => {
  if (!io) return;
  console.log(`🗑️ Email deleted: ${emailId}`);
  io.emit("email-deleted", {
    emailId,
    timestamp: new Date(),
  });
};

// ============================
// 2. TASK EVENTS
// ============================

const emitNewTask = (task) => {
  if (!io) return;
  console.log(`✅ New task created: ${task.title}`);
  io.emit("new-task", {
    task,
    timestamp: new Date(),
  });
};

const emitTaskUpdated = (task) => {
  if (!io) return;
  console.log(`🔄 Task updated: ${task.title}`);
  io.emit("task-updated", {
    task,
    timestamp: new Date(),
  });
};

const emitTaskCompleted = (taskId, task) => {
  if (!io) return;
  console.log(`✔️ Task completed: ${taskId}`);
  io.emit("task-completed", {
    taskId,
    task,
    timestamp: new Date(),
  });
};

const emitTaskDeleted = (taskId) => {
  if (!io) return;
  console.log(`🗑️ Task deleted: ${taskId}`);
  io.emit("task-deleted", {
    taskId,
    timestamp: new Date(),
  });
};

// ============================
// 3. SYNC STATUS EVENTS
// ============================

const emitSyncStarted = () => {
  if (!io) return;
  syncStatus.isSyncing = true;
  syncStatus.lastSyncStatus = "in_progress";
  console.log("🔄 Sync started");
  io.emit("sync-started", syncStatus);
};

const emitSyncCompleted = (result) => {
  if (!io) return;
  syncStatus.isSyncing = false;
  syncStatus.lastSyncStatus = "success";
  syncStatus.lastSyncTime = new Date();
  syncStatus.syncError = null;
  console.log("✅ Sync completed", result);
  io.emit("sync-completed", {
    status: syncStatus,
    result,
    timestamp: new Date(),
  });
};

const emitSyncError = (error) => {
  if (!io) return;
  syncStatus.isSyncing = false;
  syncStatus.lastSyncStatus = "error";
  syncStatus.syncError = error.message;
  console.error("❌ Sync error", error);
  io.emit("sync-error", {
    status: syncStatus,
    error: error.message,
    timestamp: new Date(),
  });
};

// ============================
// 4. DASHBOARD EVENTS
// ============================

const emitDashboardUpdate = (data) => {
  if (!io) return;
  console.log("📊 Dashboard update");
  io.emit("dashboard-updated", {
    data,
    timestamp: new Date(),
  });
};

const emitStatsUpdate = (stats) => {
  if (!io) return;
  console.log("📈 Stats updated");
  io.emit("stats-updated", {
    stats,
    timestamp: new Date(),
  });
};

// ============================
// 5. NOTIFICATION EVENTS
// ============================

const emitNotification = (notification) => {
  if (!io) return;
  console.log(`🔔 Notification: ${notification.title}`);
  io.emit("notification", {
    ...notification,
    timestamp: new Date(),
  });
};

const emitHighPriorityAlert = (email) => {
  if (!io) return;
  console.log(`⚠️ High priority alert: ${email.subject}`);
  io.emit("high-priority-alert", {
    email,
    timestamp: new Date(),
  });
};

const emitTaskReminder = (task) => {
  if (!io) return;
  console.log(`⏰ Task reminder: ${task.title}`);
  io.emit("task-reminder", {
    task,
    timestamp: new Date(),
  });
};

// ============================
// 6. AI EVENTS
// ============================

const emitAIReplyGenerated = (emailId, suggestions) => {
  if (!io) return;
  console.log(`🤖 AI reply generated for email: ${emailId}`);
  io.emit("ai-reply-generated", {
    emailId,
    suggestions,
    timestamp: new Date(),
  });
};

const emitAIAnalysisComplete = (emailId, analysis) => {
  if (!io) return;
  console.log(`🤖 AI analysis complete for email: ${emailId}`);
  io.emit("ai-analysis-complete", {
    emailId,
    analysis,
    timestamp: new Date(),
  });
};

// ============================
// 7. SYSTEM EVENTS
// ============================

const emitConnectionStatus = (connected) => {
  if (!io) return;
  const status = connected ? "🟢 Connected" : "🔴 Disconnected";
  console.log(`${status}`);
  io.emit("connection-status", {
    connected,
    timestamp: new Date(),
  });
};

const emitError = (error, context = "unknown") => {
  if (!io) return;
  console.error(`❌ Error in ${context}:`, error);
  io.emit("system-error", {
    error: error.message,
    context,
    timestamp: new Date(),
  });
};

// ============================
// 8. GET GATEWAY INSTANCE
// ============================

const getGateway = () => io;

const getSyncStatus = () => syncStatus;

module.exports = {
  // Initialization
  initializeGateway,
  getGateway,
  getSyncStatus,

  // Email events
  emitNewEmail,
  emitEmailStatusChange,
  emitEmailUpdated,
  emitEmailDeleted,

  // Task events
  emitNewTask,
  emitTaskUpdated,
  emitTaskCompleted,
  emitTaskDeleted,

  // Sync events
  emitSyncStarted,
  emitSyncCompleted,
  emitSyncError,

  // Dashboard events
  emitDashboardUpdate,
  emitStatsUpdate,

  // Notifications
  emitNotification,
  emitHighPriorityAlert,
  emitTaskReminder,

  // AI events
  emitAIReplyGenerated,
  emitAIAnalysisComplete,

  // System events
  emitConnectionStatus,
  emitError,
};

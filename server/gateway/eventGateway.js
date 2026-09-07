"use strict";

const {
  Server,
} = require("socket.io");

let io = null;

// ==========================================
// FRONTEND URL
// ==========================================

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:3000";

const PRODUCTION_FRONTEND_URL =
  process.env.PRODUCTION_FRONTEND_URL;

// ==========================================
// ALLOWED SOCKET ORIGINS
// ==========================================

const allowedOrigins = [
  FRONTEND_URL,

  PRODUCTION_FRONTEND_URL,

  "http://localhost:3000",

  "http://127.0.0.1:3000",
]
  .filter(Boolean)
  .filter(
    (value, index, array) =>
      array.indexOf(value) === index
  );

// ==========================================
// INITIALIZE SOCKET.IO
// ==========================================

const initializeGateway =
  (server) => {

    io = new Server(server, {
      cors: {
        origin(
          origin,
          callback
        ) {

          // Allow Postman,
          // server-to-server etc.
          if (!origin) {
            return callback(
              null,
              true
            );
          }

          if (
            allowedOrigins.includes(
              origin
            )
          ) {
            return callback(
              null,
              true
            );
          }

          console.error(
            `Socket.IO CORS blocked: ${origin}`
          );

          return callback(
            new Error(
              "Socket.IO CORS origin not allowed."
            )
          );
        },

        methods: [
          "GET",
          "POST",
        ],

        credentials: true,
      },

      transports: [
        "websocket",
        "polling",
      ],
    });

    // ========================================
    // CONNECTION
    // ========================================

    io.on(
      "connection",
      (socket) => {

        console.log(
          "✅ Socket Client Connected:",
          socket.id
        );

        // --------------------------------------
        // JOIN USER ROOM
        // --------------------------------------

        socket.on(
          "join-user",
          (userId) => {

            if (!userId) {
              return;
            }

            const room =
              `user:${String(
                userId
              )}`;

            socket.join(room);

            console.log(
              `👤 User joined room: ${room}`
            );
          }
        );

        // --------------------------------------
        // JOIN TEAM ROOM
        // --------------------------------------

        socket.on(
          "join-team",
          (teamId) => {

            if (!teamId) {
              return;
            }

            const room =
              `team:${String(
                teamId
              )}`;

            socket.join(room);

            console.log(
              `👥 Team joined room: ${room}`
            );
          }
        );

        // --------------------------------------
        // DISCONNECT
        // --------------------------------------

        socket.on(
          "disconnect",
          (reason) => {

            console.log(
              "❌ Socket Client Disconnected:",
              socket.id,
              reason
            );
          }
        );
      }
    );

    console.log(
      "🔌 Socket.IO Gateway Initialized"
    );

    return io;
  };

// ==========================================
// GET IO INSTANCE
// ==========================================

const getIO = () => {
  return io;
};

// ==========================================
// NEW EMAIL
// ==========================================

const emitNewEmail =
  (email) => {

    if (!io) {
      console.warn(
        "Socket.IO is not initialized."
      );

      return;
    }

    io.emit(
      "new-email",
      email
    );
  };

// ==========================================
// EMAIL UPDATED
// ==========================================

const emitEmailUpdated =
  (email) => {

    if (!io) {
      return;
    }

    io.emit(
      "email-updated",
      email
    );
  };

// ==========================================
// EMAIL DELETED
// ==========================================

const emitEmailDeleted =
  (emailId) => {

    if (!io) {
      return;
    }

    io.emit(
      "email-deleted",
      {
        emailId,
      }
    );
  };

// ==========================================
// EMAIL STATS UPDATED
// ==========================================

const emitStatsUpdated =
  (stats) => {

    if (!io) {
      return;
    }

    io.emit(
      "stats-updated",
      stats
    );
  };

// ==========================================
// NEW TASK
// ==========================================

const emitNewTask =
  (task) => {

    if (!io) {
      return;
    }

    io.emit(
      "new-task",
      task
    );
  };

// ==========================================
// TASK UPDATED
// ==========================================

const emitTaskUpdated =
  (task) => {

    if (!io) {
      return;
    }

    io.emit(
      "task-updated",
      task
    );
  };

// ==========================================
// NOTIFICATION
// ==========================================

const emitNotification =
  (notification) => {

    if (!io) {
      return;
    }

    io.emit(
      "notification",
      notification
    );
  };

// ==========================================
// USER SPECIFIC EVENT
// ==========================================

const emitToUser =
  (
    userId,
    event,
    data
  ) => {

    if (!io || !userId) {
      return;
    }

    io.to(
      `user:${String(
        userId
      )}`
    ).emit(
      event,
      data
    );
  };

// ==========================================
// TEAM SPECIFIC EVENT
// ==========================================

const emitToTeam =
  (
    teamId,
    event,
    data
  ) => {

    if (!io || !teamId) {
      return;
    }

    io.to(
      `team:${String(
        teamId
      )}`
    ).emit(
      event,
      data
    );
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  initializeGateway,

  getIO,

  emitNewEmail,

  emitEmailUpdated,

  emitEmailDeleted,

  emitStatsUpdated,

  emitNewTask,

  emitTaskUpdated,

  emitNotification,

  emitToUser,

  emitToTeam,
};
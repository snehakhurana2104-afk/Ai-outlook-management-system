// ============================================================
// client/src/services/socket.js
// Enterprise Socket.IO Client Service
// Create React App Compatible
// ============================================================

import { io } from "socket.io-client";

// ============================================================
// Socket Server URL
// ============================================================
//
// CRA-compatible environment variable:
// REACT_APP_SOCKET_URL
//
// Fallback:
// http://localhost:5000
// ============================================================

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  "http://localhost:5000";

// ============================================================
// Socket Connection
// ============================================================

const socket = io(SOCKET_URL, {
  transports: [
    "websocket",
    "polling",
  ],

  autoConnect: true,

  reconnection: true,

  reconnectionAttempts: 5,

  reconnectionDelay: 1000,

  reconnectionDelayMax: 5000,

  timeout: 20000,
});

// ============================================================
// Connection Event
// ============================================================

socket.on("connect", () => {
  console.log(
    "✅ Connected to Socket Server:",
    socket.id
  );
});

// ============================================================
// Disconnect Event
// ============================================================

socket.on("disconnect", (reason) => {
  console.log(
    "❌ Socket Disconnected:",
    reason
  );
});

// ============================================================
// Connection Error
// ============================================================

socket.on("connect_error", (error) => {
  console.error(
    "⚠️ Socket Connection Error:",
    error?.message || error
  );
});

// ============================================================
// Reconnect Event
// ============================================================

socket.on("reconnect", (attemptNumber) => {
  console.log(
    "🔄 Socket Reconnected",
    attemptNumber
  );
});

// ============================================================
// Reconnecting Event
// ============================================================

socket.on("reconnecting", (attemptNumber) => {
  console.log(
    `🔄 Socket Reconnecting... Attempt ${attemptNumber}`
  );
});

// ============================================================
// Reconnect Attempt Failed
// ============================================================

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(
    `🔁 Socket Reconnection Attempt: ${attemptNumber}`
  );
});

// ============================================================
// Reconnect Error
// ============================================================

socket.on("reconnect_error", (error) => {
  console.error(
    "⚠️ Socket Reconnect Error:",
    error?.message || error
  );
});

// ============================================================
// Reconnect Failed
// ============================================================

socket.on("reconnect_failed", () => {
  console.error(
    "❌ Socket Reconnection Failed"
  );
});

// ============================================================
// Server Connected Event
// ============================================================

socket.on("socket.connected", (payload) => {
  console.log(
    "🟢 Server Socket Connected:",
    payload
  );
});

// ============================================================
// Server Heartbeat / Pong
// ============================================================

socket.on("pong", (payload) => {
  console.log(
    "💓 Socket Pong:",
    payload
  );
});

// ============================================================
// Export
// ============================================================

export default socket;
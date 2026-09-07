import { io } from "socket.io-client";

// ======================================
// Socket Server URL
// ======================================

const SOCKET_URL = "http://localhost:5000";

// ======================================
// Socket Connection
// ======================================

const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
// ======================================
// Events
// ======================================

socket.on("connect", () => {
  console.log("✅ Connected to Socket Server");
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.error("⚠️ Socket Connection Error:", error.message);
});

socket.on("reconnect", () => {
  console.log("🔄 Socket Reconnected");
});

// ======================================
// Export
// ======================================

export default socket;
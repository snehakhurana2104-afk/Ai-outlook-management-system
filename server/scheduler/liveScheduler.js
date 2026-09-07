const { Server } = require("socket.io");

let io = null;

// =====================================
// Start Live Scheduler (Socket Server)
// =====================================

const startLiveScheduler = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Client Connected :", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Client Disconnected :", socket.id);
    });
  });

  console.log("======================================");
  console.log("✅ Live Scheduler Started");
  console.log("======================================");
};

// =====================================
// Send Event to Frontend
// =====================================

const emitNewEmail = (email) => {
  if (!io) return;

  io.emit("new-email", email);
};

module.exports = {
  startLiveScheduler,
  emitNewEmail,
};
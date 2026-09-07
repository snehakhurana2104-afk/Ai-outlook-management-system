/******************************************************************************
 * socket/socket.js
 * Part 1
 * Imports + Socket.IO Initialization + Authentication
 ******************************************************************************/

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

/* ==========================================================================
   Models
========================================================================== */

const User = require("../models/User");

/* ==========================================================================
   Socket Controller
========================================================================== */

const {
    registerSocket,
    removeSocket,
    joinRoom,
    leaveRoom,
    heartbeat,
    socketHealth,
    getConnectedUsers,
    emitDashboardUpdate,
    emitInboxUpdate,
    emitNotification,
    emitTaskUpdate,
    emitAIUpdate,
    broadcastCompanyUpdate,
    socketEvents,
} = require("../controllers/socketController");

/* ==========================================================================
   Socket.IO Instance
========================================================================== */

let io = null;

/******************************************************************************
 * Initialize Socket.IO Server
 ******************************************************************************/

const initializeSocket = (httpServer) => {

    io = new Server(httpServer, {

        cors: {

            origin: process.env.CLIENT_URL || "*",

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

        pingTimeout: 60000,

        pingInterval: 25000,

        connectTimeout: 45000,

        allowEIO3: true,

    });

    global.io = io;

    console.log("✅ Socket.IO Initialized");

    return io;

};

/******************************************************************************
 * Socket Authentication Middleware
 ******************************************************************************/

const authenticateSocket = async (socket, next) => {

    try {

        let token =
            socket.handshake.auth?.token ||
            socket.handshake.query?.token ||
            socket.handshake.headers.authorization;

        if (!token) {

            return next(
                new Error("Authentication Failed")
            );

        }

        if (token.startsWith("Bearer ")) {

            token = token.replace("Bearer ", "");

        }

        const decoded = jwt.verify(

            token,

            process.env.JWT_SECRET

        );

        const user = await User.findById(

            decoded.userId

        );

        if (!user) {

            return next(
                new Error("User Not Found")
            );

        }

        socket.user = user;

        next();

    }

    catch (error) {

        console.error(

            "[Socket Authentication Error]",

            error.message

        );

        next(
            new Error("Authentication Failed")
        );

    }

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Register Connection Handler
 ******************************************************************************/

const registerConnectionHandler = () => {

    io.use(authenticateSocket);

    io.on("connection", async (socket) => {

        try {

            console.log(
                `✅ Socket Connected : ${socket.id}`
            );

            /******************************************************************
             * Register Socket
             ******************************************************************/

            await registerSocket(
                socket,
                socket.user
            );

            /******************************************************************
             * Welcome Event
             ******************************************************************/

            socket.emit(
                "socket.connected",
                {
                    success: true,
                    socketId: socket.id,
                    connectedAt: new Date().toISOString(),
                    user: {
                        id: socket.user._id,
                        name: socket.user.displayName,
                        email: socket.user.email,
                        role: socket.user.role,
                    },
                }
            );

            /******************************************************************
             * Client Ready
             ******************************************************************/

            socket.on(
                "client.ready",
                () => {

                    console.log(
                        `[READY] ${socket.user.displayName}`
                    );

                }
            );

            /******************************************************************
             * Heartbeat
             ******************************************************************/

            socket.on(
                "heartbeat",
                async () => {

                    await heartbeat(
                        io,
                        socket
                    );

                }
            );

            /******************************************************************
             * Ping / Pong
             ******************************************************************/

            socket.on(
                "ping",
                () => {

                    socket.emit(
                        "pong",
                        {
                            serverTime:
                                new Date().toISOString(),
                        }
                    );

                }
            );

            /******************************************************************
             * Join Room
             ******************************************************************/

            socket.on(
                "room.join",
                async (room) => {

                    try {

                        await joinRoom(
                            io,
                            socket,
                            room
                        );

                    }

                    catch (error) {

                        socket.emit(
                            "room.error",
                            {
                                success: false,
                                message: error.message,
                            }
                        );

                    }

                }
            );

            /******************************************************************
             * Leave Room
             ******************************************************************/

            socket.on(
                "room.leave",
                async (room) => {

                    try {

                        await leaveRoom(
                            io,
                            socket,
                            room
                        );

                    }

                    catch (error) {

                        socket.emit(
                            "room.error",
                            {
                                success: false,
                                message: error.message,
                            }
                        );

                    }

                }
            );

            /******************************************************************
             * Dashboard Events
             ******************************************************************/

            socket.on(
                "dashboard.refresh",
                async (payload = {}) => {

                    await emitDashboardUpdate(
                        io,
                        payload
                    );

                }
            );

            /******************************************************************
             * Inbox Events
             ******************************************************************/

            socket.on(
                "inbox.refresh",
                async (payload = {}) => {

                    await emitInboxUpdate(
                        io,
                        payload
                    );

                }
            );

            /******************************************************************
             * Notification Events
             ******************************************************************/

            socket.on(
                "notification.send",
                async (payload = {}) => {

                    await emitNotification(
                        io,
                        payload
                    );

                }
            );

            /******************************************************************
             * Task Events
             ******************************************************************/

            socket.on(
                "task.update",
                async (payload = {}) => {

                    await emitTaskUpdate(
                        io,
                        payload
                    );

                }
            );

            /******************************************************************
             * AI Events
             ******************************************************************/

            socket.on(
                "ai.update",
                async (payload = {}) => {

                    await emitAIUpdate(
                        io,
                        payload
                    );

                }
            );

            /******************************************************************
             * Company Events
             ******************************************************************/

            socket.on(
                "company.update",
                async (payload = {}) => {

                    await broadcastCompanyUpdate(
                        io,
                        payload
                    );

                }
            );

            /******************************************************************
             * Disconnect
             ******************************************************************/

            socket.on(
                "disconnect",
                async (reason) => {

                    console.log(
                        `❌ Socket Disconnected : ${socket.id}`
                    );

                    console.log(
                        `Reason : ${reason}`
                    );

                    await removeSocket(
                        socket.id
                    );

                }
            );

        }

        catch (error) {

            console.error(
                "[Socket Connection Error]",
                error.message
            );

            socket.disconnect(true);

        }

    });

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/**********************************************************************
 * Socket Event Bus
 **********************************************************************/

socketEvents.on("socket.connected", (payload) => {
    console.log("[EVENT] socket.connected", payload);
});

socketEvents.on("socket.disconnected", (payload) => {
    console.log("[EVENT] socket.disconnected", payload);
});

socketEvents.on("dashboard.update", (payload) => {
    console.log("[EVENT] dashboard.update", payload);
});

socketEvents.on("inbox.update", (payload) => {
    console.log("[EVENT] inbox.update", payload);
});

socketEvents.on("notification.created", (payload) => {
    console.log("[EVENT] notification.created", payload);
});

socketEvents.on("task.updated", (payload) => {
    console.log("[EVENT] task.updated", payload);
});

socketEvents.on("company.updated", (payload) => {
    console.log("[EVENT] company.updated", payload);
});

socketEvents.on("ai.updated", (payload) => {
    console.log("[EVENT] ai.updated", payload);
});

/**********************************************************************
 * Get Socket Instance
 **********************************************************************/

const getIO = () => io;

/**********************************************************************
 * Export
 **********************************************************************/

module.exports = {
    initializeSocket,
    authenticateSocket,
    registerConnectionHandler,
    getIO,
};
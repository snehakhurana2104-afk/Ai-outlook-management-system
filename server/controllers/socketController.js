/******************************************************************************
 * socketController.js
 * Part 1
 * Enterprise Socket.IO Controller
 ******************************************************************************/

const crypto = require("crypto");
const EventEmitter = require("events");

/* ==========================================================================
   Models
========================================================================== */

const User = require("../models/User");
const Email = require("../models/Email");
const Task = require("../models/Task");

/* ==========================================================================
   Event Bus
========================================================================== */

const socketEvents = new EventEmitter();

/* ==========================================================================
   Connected Users Registry
========================================================================== */

const connectedUsers = new Map();

/*
Map Structure

userId => {
    socketId,
    displayName,
    email,
    connectedAt,
    lastSeen,
    rooms:[]
}
*/

/* ==========================================================================
   Active Rooms
========================================================================== */

const activeRooms = new Map();

/*
roomName => Set(socketIds)
*/

/* ==========================================================================
   Response Helpers
========================================================================== */

const successResponse = (
    success = true,
    message = "Success",
    data = {}
) => ({

    success,

    message,

    data,

    timestamp: new Date().toISOString(),

});

/* ==========================================================================
   Register Socket
========================================================================== */

const registerSocket = async (
    socket,
    user
) => {

    try {

        connectedUsers.set(

            String(user._id),

            {

                socketId: socket.id,

                displayName: user.displayName,

                email: user.email,

                connectedAt: new Date(),

                lastSeen: new Date(),

                rooms: [],

            }

        );

        socketEvents.emit(

            "socket.connected",

            {

                userId: user._id,

                socketId: socket.id,

            }

        );

        return successResponse(

            true,

            "Socket Registered",

            {

                socketId: socket.id,

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Register Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Remove Socket
========================================================================== */

const removeSocket = async (
    socketId
) => {

    try {

        let removedUser = null;

        for (const [userId, info] of connectedUsers.entries()) {

            if (info.socketId === socketId) {

                removedUser = {

                    userId,

                    ...info,

                };

                connectedUsers.delete(userId);

                break;

            }

        }

        socketEvents.emit(

            "socket.disconnected",

            removedUser

        );

        return successResponse(

            true,

            "Socket Removed",

            removedUser

        );

    }

    catch (error) {

        console.error(

            "[Socket Remove Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * joinRoom()
 ******************************************************************************/

const joinRoom = async (
    io,
    socket,
    roomName
) => {

    try {

        if (!roomName) {

            throw new Error(
                "Room name is required."
            );

        }

        socket.join(roomName);

        if (!activeRooms.has(roomName)) {

            activeRooms.set(
                roomName,
                new Set()
            );

        }

        activeRooms
            .get(roomName)
            .add(socket.id);

        for (const [userId, info] of connectedUsers.entries()) {

            if (info.socketId === socket.id) {

                if (!info.rooms.includes(roomName)) {

                    info.rooms.push(roomName);

                    info.lastSeen =
                        new Date();

                    connectedUsers.set(
                        userId,
                        info
                    );

                }

                break;

            }

        }

        io.to(roomName).emit(

            "room.joined",

            successResponse(

                true,

                "User joined room.",

                {

                    room: roomName,

                    socketId: socket.id,

                    members:
                        activeRooms
                            .get(roomName)
                            .size,

                }

            )

        );

        socketEvents.emit(

            "room.joined",

            {

                room: roomName,

                socketId: socket.id,

            }

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Join Room Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * leaveRoom()
 ******************************************************************************/

const leaveRoom = async (
    io,
    socket,
    roomName
) => {

    try {

        socket.leave(roomName);

        if (activeRooms.has(roomName)) {

            activeRooms
                .get(roomName)
                .delete(socket.id);

            if (

                activeRooms
                    .get(roomName)
                    .size === 0

            ) {

                activeRooms.delete(
                    roomName
                );

            }

        }

        for (const [userId, info] of connectedUsers.entries()) {

            if (info.socketId === socket.id) {

                info.rooms =
                    info.rooms.filter(

                        (room) =>
                            room !== roomName

                    );

                info.lastSeen =
                    new Date();

                connectedUsers.set(

                    userId,

                    info

                );

                break;

            }

        }

        io.to(roomName).emit(

            "room.left",

            successResponse(

                true,

                "User left room.",

                {

                    room: roomName,

                    socketId: socket.id,

                    members:

                        activeRooms.has(roomName)

                            ? activeRooms.get(roomName).size

                            : 0,

                }

            )

        );

        socketEvents.emit(

            "room.left",

            {

                room: roomName,

                socketId: socket.id,

            }

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Leave Room Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * getConnectedUsers()
 ******************************************************************************/

const getConnectedUsers = async () => {

    try {

        const users = [];

        for (

            const [

                userId,

                info,

            ]

            of connectedUsers.entries()

        ) {

            users.push({

                userId,

                displayName:
                    info.displayName,

                email:
                    info.email,

                socketId:
                    info.socketId,

                connectedAt:
                    info.connectedAt,

                lastSeen:
                    info.lastSeen,

                rooms:
                    info.rooms,

            });

        }

        return successResponse(

            true,

            "Connected users.",

            {

                totalUsers:

                    users.length,

                users,

            }

        );

    }

    catch (error) {

        console.error(

            "[Connected Users Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * emitDashboardUpdate()
 ******************************************************************************/

const emitDashboardUpdate = async (
    io,
    payload = {}
) => {

    try {

        const event = {

            type: "dashboard",

            timestamp:
                new Date().toISOString(),

            data: payload,

        };

        io.emit(

            "dashboard:update",

            successResponse(

                true,

                "Dashboard updated.",

                event

            )

        );

        socketEvents.emit(

            "dashboard.update",

            event

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Dashboard Emit Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * emitInboxUpdate()
 ******************************************************************************/

const emitInboxUpdate = async (
    io,
    payload = {}
) => {

    try {

        const event = {

            type: "inbox",

            timestamp:
                new Date().toISOString(),

            data: payload,

        };

        io.emit(

            "inbox:update",

            successResponse(

                true,

                "Inbox updated.",

                event

            )

        );

        socketEvents.emit(

            "inbox.update",

            event

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Inbox Emit Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * emitNotification()
 ******************************************************************************/

const emitNotification = async (
    io,
    notification = {}
) => {

    try {

        const event = {

            id: crypto.randomUUID(),

            createdAt:
                new Date().toISOString(),

            ...notification,

        };

        /*
         * Global Notification
         */

        io.emit(

            "notification:new",

            successResponse(

                true,

                "New notification.",

                event

            )

        );

        /*
         * Event Bus
         */

        socketEvents.emit(

            "notification.created",

            event

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Notification Emit Error]",

            error.message

        );

        return false;

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * emitTaskUpdate()
 ******************************************************************************/

const emitTaskUpdate = async (
    io,
    task = {}
) => {

    try {

        const payload = {

            event: "task",

            timestamp:
                new Date().toISOString(),

            task,

        };

        io.emit(

            "task:update",

            successResponse(

                true,

                "Task updated successfully.",

                payload

            )

        );

        socketEvents.emit(

            "task.updated",

            payload

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Task Update Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * emitAIUpdate()
 ******************************************************************************/

const emitAIUpdate = async (
    io,
    aiResult = {}
) => {

    try {

        const payload = {

            event: "ai",

            timestamp:
                new Date().toISOString(),

            result: aiResult,

        };

        io.emit(

            "ai:update",

            successResponse(

                true,

                "AI processing completed.",

                payload

            )

        );

        socketEvents.emit(

            "ai.updated",

            payload

        );

        return true;

    }

    catch (error) {

        console.error(

            "[AI Update Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * broadcastCompanyUpdate()
 ******************************************************************************/

const broadcastCompanyUpdate = async (
    io,
    company = {}
) => {

    try {

        const payload = {

            event: "company",

            timestamp:
                new Date().toISOString(),

            company,

        };

        io.emit(

            "company:update",

            successResponse(

                true,

                "Company information updated.",

                payload

            )

        );

        socketEvents.emit(

            "company.updated",

            payload

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Company Broadcast Error]",

            error.message

        );

        return false;

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * heartbeat()
 ******************************************************************************/

const heartbeat = async (
    io,
    socket
) => {

    try {

        for (

            const [

                userId,

                info,

            ]

            of connectedUsers.entries()

        ) {

            if (

                info.socketId === socket.id

            ) {

                info.lastSeen =
                    new Date();

                connectedUsers.set(

                    userId,

                    info

                );

                break;

            }

        }

        socket.emit(

            "heartbeat",

            successResponse(

                true,

                "Heartbeat received.",

                {

                    socketId:
                        socket.id,

                    serverTime:
                        new Date().toISOString(),

                }

            )

        );

        socketEvents.emit(

            "socket.heartbeat",

            {

                socketId:
                    socket.id,

            }

        );

        return true;

    }

    catch (error) {

        console.error(

            "[Heartbeat Error]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * socketHealth()
 ******************************************************************************/

const socketHealth = async () => {

    try {

        const rooms = [];

        for (

            const [

                room,

                sockets,

            ]

            of activeRooms.entries()

        ) {

            rooms.push({

                room,

                members:
                    sockets.size,

            });

        }

        return successResponse(

            true,

            "Socket service healthy.",

            {

                connectedUsers:

                    connectedUsers.size,

                activeRooms:

                    rooms.length,

                rooms,

                uptime:

                    process.uptime(),

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Health Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    registerSocket,

    removeSocket,

    joinRoom,

    leaveRoom,

    getConnectedUsers,

    emitDashboardUpdate,

    emitInboxUpdate,

    emitNotification,

    emitTaskUpdate,

    emitAIUpdate,

    broadcastCompanyUpdate,

    heartbeat,

    socketHealth,

    socketEvents,

    connectedUsers,

    activeRooms,

};

/******************************************************************************
 * End socketController.js
 ******************************************************************************/
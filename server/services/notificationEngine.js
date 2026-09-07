/******************************************************************************
 * services/notificationEngine.js
 * Enterprise Notification Engine
 ******************************************************************************/

/* ==========================================================================
   Models
========================================================================== */

const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");

/* ==========================================================================
   Services
========================================================================== */

const socketController = require("../controllers/socketController");

/* ==========================================================================
   Queue
========================================================================== */

const notificationQueue = [];

/* ==========================================================================
   Helpers
========================================================================== */

const now = () => new Date().toISOString();

const normalizePriority = (priority = "Medium") => {

    const allowed = [
        "Low",
        "Medium",
        "High",
        "Critical",
    ];

    return allowed.includes(priority)
        ? priority
        : "Medium";

};

const shouldDeliver = async (userId, category, priority) => {

    const preference =
        await NotificationPreference.findOne({
            userId,
        });

    if (!preference) {

        return true;

    }

    if (
        preference.priority &&
        preference.priority[
            priority.toLowerCase()
        ] === false
    ) {

        return false;

    }

    if (
        preference.categories &&
        category &&
        preference.categories[category] === false
    ) {

        return false;

    }

    return true;

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Create Notification
 ******************************************************************************/

const createNotification = async (payload = {}) => {

    try {

        const {

            userId,

            title,

            message,

            type = "system",

            category = "system",

            priority = "Medium",

            metadata = {},

        } = payload;

        /* ------------------------------------------------------------
           Check User Preferences
        ------------------------------------------------------------ */

        const allowed = await shouldDeliver(

            userId,

            category,

            priority

        );

        if (!allowed) {

            return {

                success: false,

                skipped: true,

                reason: "Blocked by notification preferences",

            };

        }

        /* ------------------------------------------------------------
           Create Database Record
        ------------------------------------------------------------ */

        const notification = await Notification.create({

            userId,

            title,

            message,

            type,

            category,

            priority: normalizePriority(priority),

            metadata,

            isRead: false,

            archived: false,

            delivered: false,

            createdAt: new Date(),

        });

        /* ------------------------------------------------------------
           Push Into Queue
        ------------------------------------------------------------ */

        notificationQueue.push({

            notificationId: notification._id,

            userId,

            priority,

            createdAt: Date.now(),

            retries: 0,

        });

        return {

            success: true,

            notification,

            queueSize: notificationQueue.length,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Notification Engine] Create Error",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Queue Notification
 ******************************************************************************/

const queueNotification = async (notification) => {

    try {

        notificationQueue.push({

            notificationId: notification._id,

            userId: notification.userId,

            priority: notification.priority,

            retries: 0,

            queuedAt: Date.now(),

        });

        return {

            success: true,

            queueSize: notificationQueue.length,

        };

    }

    catch (error) {

        console.error(

            "[Notification Queue Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Get Queue Status
 ******************************************************************************/

const getQueueStatus = () => {

    return {

        size: notificationQueue.length,

        notifications: notificationQueue,

        timestamp: now(),

    };

};


/******************************************************************************
 * Clear Queue
 ******************************************************************************/

const clearQueue = () => {

    notificationQueue.length = 0;

    return {

        success: true,

        size: 0,

        timestamp: now(),

    };

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Broadcast Notification
 ******************************************************************************/

const broadcastNotification = async (notification) => {

    try {

        if (!notification) {

            throw new Error(
                "Notification payload is required."
            );

        }

        /* ------------------------------------------------------------
           Emit to User Room
        ------------------------------------------------------------ */

        socketController.emitToUser(

            notification.userId.toString(),

            "notification.created",

            {

                success: true,

                notification,

                timestamp: now(),

            }

        );

        /* ------------------------------------------------------------
           Emit Dashboard Update
        ------------------------------------------------------------ */

        socketController.emitToUser(

            notification.userId.toString(),

            "dashboard.update",

            {

                notificationId:
                    notification._id,

                priority:
                    notification.priority,

                type:
                    notification.type,

                timestamp: now(),

            }

        );

        /* ------------------------------------------------------------
           Mark Delivered
        ------------------------------------------------------------ */

        await Notification.findByIdAndUpdate(

            notification._id,

            {

                delivered: true,

                deliveredAt: new Date(),

            }

        );

        return {

            success: true,

            delivered: true,

            notificationId:
                notification._id,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Notification Broadcast Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Broadcast Queue
 ******************************************************************************/

const broadcastQueue = async () => {

    try {

        while (notificationQueue.length > 0) {

            const item =
                notificationQueue.shift();

            const notification =
                await Notification.findById(

                    item.notificationId

                );

            if (!notification) {

                continue;

            }

            await broadcastNotification(

                notification

            );

        }

        return {

            success: true,

            remaining:
                notificationQueue.length,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Broadcast Queue Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Broadcast System Notification
 ******************************************************************************/

const broadcastSystemNotification = async (

    payload

) => {

    try {

        socketController.emitAll(

            "system.notification",

            {

                ...payload,

                timestamp: now(),

            }

        );

        return {

            success: true,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[System Broadcast Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Process Notification Queue
 ******************************************************************************/

const processNotificationQueue = async () => {

    try {

        while (notificationQueue.length > 0) {

            const queueItem =

                notificationQueue.shift();

            if (!queueItem) {

                continue;

            }

            try {

                const notification =

                    await Notification.findById(

                        queueItem.notificationId

                    );

                if (!notification) {

                    continue;

                }

                await broadcastNotification(

                    notification

                );

            }

            catch (error) {

                console.error(

                    "[Queue Processing Error]",

                    error.message

                );

                await retryNotification(

                    queueItem

                );

            }

        }

        return {

            success: true,

            pending:

                notificationQueue.length,

            processedAt:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Notification Queue Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Retry Notification
 ******************************************************************************/

const retryNotification = async (

    queueItem

) => {

    try {

        queueItem.retries =

            (queueItem.retries || 0) + 1;

        if (queueItem.retries >= 3) {

            console.error(

                "[Retry Failed]",

                queueItem.notificationId

            );

            await Notification.findByIdAndUpdate(

                queueItem.notificationId,

                {

                    delivered: false,

                    failed: true,

                    failedAt: new Date(),

                }

            );

            return;

        }

        notificationQueue.push(

            queueItem

        );

    }

    catch (error) {

        console.error(

            "[Retry Error]",

            error.message

        );

    }

};


/******************************************************************************
 * Queue Worker
 ******************************************************************************/

const startQueueWorker = () => {

    console.log(

        "[Notification Engine] Queue Worker Started"

    );

    setInterval(

        async () => {

            try {

                await processNotificationQueue();

            }

            catch (error) {

                console.error(

                    "[Queue Worker]",

                    error.message

                );

            }

        },

        3000

    );

};


/******************************************************************************
 * Get Queue Health
 ******************************************************************************/

const getQueueHealth = () => {

    return {

        success: true,

        pending:

            notificationQueue.length,

        running: true,

        checkedAt:

            now(),

    };

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Notification Engine Health
 ******************************************************************************/

const notificationHealth = async () => {

    try {

        const totalNotifications =
            await Notification.countDocuments();

        const deliveredNotifications =
            await Notification.countDocuments({

                delivered: true,

            });

        const failedNotifications =
            await Notification.countDocuments({

                failed: true,

            });

        const pendingNotifications =
            notificationQueue.length;

        return {

            success: true,

            service: "Notification Engine",

            status: "healthy",

            database: "connected",

            queue: {

                pending: pendingNotifications,

            },

            statistics: {

                total: totalNotifications,

                delivered: deliveredNotifications,

                failed: failedNotifications,

            },

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Notification Engine Health]",

            error.message

        );

        return {

            success: false,

            service: "Notification Engine",

            status: "unhealthy",

            error: error.message,

            timestamp: now(),

        };

    }

};


/******************************************************************************
 * Engine Statistics
 ******************************************************************************/

const getEngineStatistics = async () => {

    try {

        return {

            success: true,

            queueSize:

                notificationQueue.length,

            processedNotifications:

                await Notification.countDocuments({

                    delivered: true,

                }),

            failedNotifications:

                await Notification.countDocuments({

                    failed: true,

                }),

            totalNotifications:

                await Notification.countDocuments(),

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Engine Statistics]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Reset Queue
 ******************************************************************************/

const resetQueue = () => {

    notificationQueue.length = 0;

    return {

        success: true,

        message:

            "Notification queue reset successfully.",

        timestamp: now(),

    };

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    createNotification,

    queueNotification,

    getQueueStatus,

    clearQueue,

    broadcastNotification,

    broadcastQueue,

    broadcastSystemNotification,

    processNotificationQueue,

    retryNotification,

    startQueueWorker,

    getQueueHealth,

    notificationHealth,

    getEngineStatistics,

    resetQueue,

};

/******************************************************************************
 * End services/notificationEngine.js
 ******************************************************************************/
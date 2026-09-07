/******************************************************************************
 * controllers/notificationController.js
 * Part 1
 * Imports + Helpers + Response Utilities
 ******************************************************************************/

/* ==========================================================================
   Models
========================================================================== */

const Notification = require("../models/Notification");

/* ==========================================================================
   Services
========================================================================== */

const notificationService = require("../services/notificationService");

const graphNotificationService =
    require("../services/graphNotificationService");

const graphMailService =
    require("../services/graphMailService");

const aiPriorityService =
    require("../services/aiPriorityService");

const aiSuggestionService =
    require("../services/aiSuggestionService");

/* ==========================================================================
   Success Response Helper
========================================================================== */

const successResponse = (
    res,
    data = {},
    message = "Success",
    status = 200
) => {

    return res.status(status).json({

        success: true,

        message,

        data,

        timestamp: new Date().toISOString(),

    });

};

/* ==========================================================================
   Error Response Helper
========================================================================== */

const errorResponse = (
    res,
    error,
    status = 500
) => {

    console.error(

        "[NotificationController]",

        error

    );

    return res.status(status).json({

        success: false,

        message:
            error?.message ||
            "Internal Server Error",

        timestamp:
            new Date().toISOString(),

    });

};

/* ==========================================================================
   Utility Helpers
========================================================================== */

const safeNumber = (value) =>
    Number(value || 0);

const safeArray = (value) =>
    Array.isArray(value) ? value : [];

const safeObject = (value) =>
    value || {};

/* ==========================================================================
   Pagination Helper
========================================================================== */

const getPagination = (req) => {

    const page = Math.max(
        parseInt(req.query.page || 1, 10),
        1
    );

    const limit = Math.max(
        parseInt(req.query.limit || 20, 10),
        1
    );

    return {

        page,

        limit,

        skip: (page - 1) * limit,

    };

};

/* ==========================================================================
   Search Helper
========================================================================== */

const buildSearchQuery = (search = "") => {

    if (!search) {

        return {};

    }

    return {

        $or: [

            {

                title: {

                    $regex: search,

                    $options: "i",

                },

            },

            {

                message: {

                    $regex: search,

                    $options: "i",

                },

            },

            {

                type: {

                    $regex: search,

                    $options: "i",

                },

            },

        ],

    };

};

/* ==========================================================================
   Notification Validation
========================================================================== */

const validateNotification = async (
    notificationId
) => {

    const notification =
        await Notification.findById(notificationId);

    if (!notification) {

        throw new Error(
            "Notification not found."
        );

    }

    return notification;

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Create Notification
 ******************************************************************************/

const createNotification = async (req, res) => {

    try {

        const notification =
            await notificationService.createNotification({

                ...req.body,

                createdBy: req.user?._id,

            });

        return successResponse(

            res,

            {

                notification,

                generatedAt:
                    new Date().toISOString(),

            },

            "Notification created successfully.",

            201

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * Create AI Notification
 ******************************************************************************/

const createAINotification = async (req, res) => {

    try {

        const {

            userId,

            title,

            message,

            priority,

            metadata,

        } = req.body;

        /* -------------------------------------------------------------
           AI Priority Prediction (Optional)
        ------------------------------------------------------------- */

        let predictedPriority = priority;

        try {

            if (!predictedPriority) {

                const aiResult =
                    await aiPriorityService.predictPriority({

                        title,

                        message,

                    });

                predictedPriority =
                    aiResult.priority;

            }

        }

        catch (error) {

            console.warn(

                "[AI Priority Warning]",

                error.message

            );

            predictedPriority = "Medium";

        }

        /* -------------------------------------------------------------
           AI Suggestions (Optional)
        ------------------------------------------------------------- */

        let suggestions = [];

        try {

            suggestions =
                await aiSuggestionService.generateSuggestions({

                    title,

                    message,

                });

        }

        catch (error) {

            console.warn(

                "[AI Suggestion Warning]",

                error.message

            );

        }

        /* -------------------------------------------------------------
           Save Notification
        ------------------------------------------------------------- */

        const notification =
            await notificationService.createAINotification({

                userId,

                title,

                message,

                priority:
                    predictedPriority,

                metadata,

                suggestions,

            });

        return successResponse(

            res,

            {

                notification,

                ai: {

                    priority:
                        predictedPriority,

                    suggestions,

                },

                generatedAt:

                    new Date().toISOString(),

            },

            "AI notification created successfully.",

            201

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Notifications
 ******************************************************************************/

const getNotifications = async (req, res) => {

    try {

        const {

            page,

            limit,

            skip,

        } = getPagination(req);

        const searchQuery = buildSearchQuery(

            req.query.search

        );

        const notifications =

            await Notification.find({

                userId: req.user._id,

                ...searchQuery,

            })

                .sort({

                    createdAt: -1,

                })

                .skip(skip)

                .limit(limit)

                .lean();

        const total =

            await Notification.countDocuments({

                userId: req.user._id,

                ...searchQuery,

            });

        return successResponse(

            res,

            {

                notifications,

                pagination: {

                    page,

                    limit,

                    total,

                    pages: Math.ceil(

                        total / limit

                    ),

                },

                generatedAt:

                    new Date().toISOString(),

            },

            "Notifications loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};


/******************************************************************************
 * Get Unread Notifications
 ******************************************************************************/

const getUnreadNotifications = async (req, res) => {

    try {

        const notifications =

            await Notification.find({

                userId: req.user._id,

                isRead: false,

            })

                .sort({

                    createdAt: -1,

                })

                .lean();

        return successResponse(

            res,

            {

                total:

                    notifications.length,

                notifications,

                generatedAt:

                    new Date().toISOString(),

            },

            "Unread notifications loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};


/******************************************************************************
 * Search Notifications
 ******************************************************************************/

const searchNotifications = async (req, res) => {

    try {

        const keyword =

            req.query.search || "";

        const searchQuery =

            buildSearchQuery(keyword);

        const notifications =

            await Notification.find({

                userId: req.user._id,

                ...searchQuery,

            })

                .sort({

                    createdAt: -1,

                })

                .lean();

        return successResponse(

            res,

            {

                keyword,

                total:

                    notifications.length,

                notifications,

                generatedAt:

                    new Date().toISOString(),

            },

            "Notification search completed."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Mark Notification As Read
 ******************************************************************************/

const markNotificationAsRead = async (req, res) => {

    try {

        const { notificationId } = req.params;

        const notification = await validateNotification(
            notificationId
        );

        notification.isRead = true;
        notification.readAt = new Date();

        await notification.save();

        return successResponse(

            res,

            {

                notification,

                generatedAt:
                    new Date().toISOString(),

            },

            "Notification marked as read."

        );

    }

    catch (error) {

        return errorResponse(
            res,
            error
        );

    }

};

/******************************************************************************
 * Mark All Notifications As Read
 ******************************************************************************/

const markAllNotificationsAsRead = async (req, res) => {

    try {

        const result =

            await Notification.updateMany(

                {

                    userId: req.user._id,

                    isRead: false,

                },

                {

                    $set: {

                        isRead: true,

                        readAt: new Date(),

                    },

                }

            );

        return successResponse(

            res,

            {

                modifiedCount:

                    result.modifiedCount ||

                    result.nModified ||

                    0,

                generatedAt:
                    new Date().toISOString(),

            },

            "All notifications marked as read."

        );

    }

    catch (error) {

        return errorResponse(
            res,
            error
        );

    }

};

/******************************************************************************
 * Delete Notification
 ******************************************************************************/

const deleteNotification = async (req, res) => {

    try {

        const { notificationId } = req.params;

        await validateNotification(notificationId);

        await Notification.findByIdAndDelete(
            notificationId
        );

        return successResponse(

            res,

            {

                notificationId,

                generatedAt:
                    new Date().toISOString(),

            },

            "Notification deleted successfully."

        );

    }

    catch (error) {

        return errorResponse(
            res,
            error
        );

    }

};

/******************************************************************************
 * Clear All Notifications
 ******************************************************************************/

const clearNotifications = async (req, res) => {

    try {

        const result =

            await Notification.deleteMany({

                userId: req.user._id,

            });

        return successResponse(

            res,

            {

                deletedCount:

                    result.deletedCount,

                generatedAt:
                    new Date().toISOString(),

            },

            "All notifications cleared successfully."

        );

    }

    catch (error) {

        return errorResponse(
            res,
            error
        );

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * getNotificationStats()
 ******************************************************************************/

const getNotificationStats = async (req, res) => {

    try {

        const totalNotifications =
            await Notification.countDocuments({

                userId: req.user._id,

            });

        const unreadNotifications =
            await Notification.countDocuments({

                userId: req.user._id,

                isRead: false,

            });

        const readNotifications =
            await Notification.countDocuments({

                userId: req.user._id,

                isRead: true,

            });

        const archivedNotifications =
            await Notification.countDocuments({

                userId: req.user._id,

                archived: true,

            });

        const highPriority =
            await Notification.countDocuments({

                userId: req.user._id,

                priority: "High",

            });

        const mediumPriority =
            await Notification.countDocuments({

                userId: req.user._id,

                priority: "Medium",

            });

        const lowPriority =
            await Notification.countDocuments({

                userId: req.user._id,

                priority: "Low",

            });

        return successResponse(

            res,

            {

                totalNotifications,

                unreadNotifications,

                readNotifications,

                archivedNotifications,

                priority: {

                    high: highPriority,

                    medium: mediumPriority,

                    low: lowPriority,

                },

                generatedAt:
                    new Date().toISOString(),

            },

            "Notification statistics loaded successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};


/******************************************************************************
 * Filter Notifications
 ******************************************************************************/

const filterNotifications = async (req, res) => {

    try {

        const query = {

            userId: req.user._id,

        };

        if (req.query.priority) {

            query.priority = req.query.priority;

        }

        if (req.query.type) {

            query.type = req.query.type;

        }

        if (req.query.category) {

            query.category = req.query.category;

        }

        if (req.query.archived !== undefined) {

            query.archived =
                req.query.archived === "true";

        }

        if (req.query.isRead !== undefined) {

            query.isRead =
                req.query.isRead === "true";

        }

        const notifications =
            await Notification.find(query)

                .sort({

                    createdAt: -1,

                })

                .lean();

        return successResponse(

            res,

            {

                total:

                    notifications.length,

                notifications,

                filters:

                    req.query,

                generatedAt:
                    new Date().toISOString(),

            },

            "Notifications filtered successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};


/******************************************************************************
 * Archive Notification
 ******************************************************************************/

const archiveNotification = async (req, res) => {

    try {

        const { notificationId } =
            req.params;

        const notification =
            await validateNotification(

                notificationId

            );

        notification.archived = true;

        notification.archivedAt =
            new Date();

        await notification.save();

        return successResponse(

            res,

            {

                notification,

                generatedAt:
                    new Date().toISOString(),

            },

            "Notification archived successfully."

        );

    }

    catch (error) {

        return errorResponse(

            res,

            error

        );

    }

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Create AI Notification
 ******************************************************************************/

const createAINotification = async (req, res) => {

    try {

        const {

            title,

            message,

            priority,

            metadata = {},

        } = req.body;

        const notification =
            await Notification.create({

                userId: req.user._id,

                title,

                message,

                type: "AI",

                priority: priority || "Medium",

                metadata,

                isRead: false,

                archived: false,

            });

        return successResponse(

            res,

            {

                notification,

                generatedAt:
                    new Date().toISOString(),

            },

            "AI notification created successfully.",

            201

        );

    }

    catch (error) {

        return errorResponse(res, error);

    }

};


/******************************************************************************
 * Sync Microsoft Graph Notifications
 ******************************************************************************/

const syncGraphNotifications = async (req, res) => {

    try {

        const result =
            await graphNotificationService.syncNotifications(

                req.user

            );

        return successResponse(

            res,

            {

                synchronized:

                    result?.count || 0,

                notifications:

                    result?.notifications || [],

                generatedAt:
                    new Date().toISOString(),

            },

            "Microsoft Graph notifications synchronized successfully."

        );

    }

    catch (error) {

        return errorResponse(res, error);

    }

};


/******************************************************************************
 * Notification Health Check
 ******************************************************************************/

const notificationHealth = async (req, res) => {

    try {

        const total =
            await Notification.countDocuments();

        const unread =
            await Notification.countDocuments({

                isRead: false,

            });

        return successResponse(

            res,

            {

                status: "healthy",

                database: "connected",

                totalNotifications: total,

                unreadNotifications: unread,

                service: "Notification Service",

                timestamp:
                    new Date().toISOString(),

            },

            "Notification service is healthy."

        );

    }

    catch (error) {

        return errorResponse(res, error);

    }

};


/******************************************************************************
 * Export Controller
 ******************************************************************************/

module.exports = {

    createNotification,

    createAINotification,

    getNotifications,

    getUnreadNotifications,

    searchNotifications,

    markNotificationAsRead,

    markAllNotificationsAsRead,

    deleteNotification,

    clearNotifications,

    getNotificationStats,

    filterNotifications,

    archiveNotification,

    syncGraphNotifications,

    notificationHealth,

};

/******************************************************************************
 * End notificationController.js
 ******************************************************************************/
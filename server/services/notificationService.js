/******************************************************************************
 * services/notificationService.js
 * Part 1
 * Imports + Create Notification
 ******************************************************************************/

const Notification = require("../models/Notification");

/* ==========================================================================
   Create Notification
========================================================================== */

const createNotification = async (data = {}) => {

    try {

        const notification = await Notification.create({

            userId: data.userId,

            title: data.title,

            message: data.message,

            type: data.type || "info",

            category: data.category || "system",

            priority: data.priority || "medium",

            actionUrl: data.actionUrl || "",

            icon: data.icon || "bell",

            metadata: data.metadata || {},

            expiresAt: data.expiresAt || null,

        });

        return notification;

    }

    catch (error) {

        console.error(

            "[Notification Create Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Create AI Notification
========================================================================== */

const createAINotification = async (

    userId,

    title,

    message,

    metadata = {}

) => {

    return await createNotification({

        userId,

        title,

        message,

        type: "ai",

        category: "ai",

        priority: "high",

        icon: "cpu",

        metadata,

    });

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * services/notificationService.js
 * Part 2
 * Get Notifications + Read + Delete
 ******************************************************************************/

/* ==========================================================================
   Get User Notifications
========================================================================== */

const getNotifications = async (

    userId,

    page = 1,

    limit = 20

) => {

    try {

        const skip =

            (page - 1) * limit;

        const notifications =

            await Notification.find({

                userId,

                isArchived: false,

            })

                .sort({

                    createdAt: -1,

                })

                .skip(skip)

                .limit(limit);

        const total =

            await Notification.countDocuments({

                userId,

                isArchived: false,

            });

        return {

            notifications,

            pagination: {

                page,

                limit,

                total,

                pages: Math.ceil(

                    total / limit

                ),

            },

        };

    }

    catch (error) {

        console.error(

            "[Notification Fetch Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Mark Notification Read
========================================================================== */

const markAsRead = async (

    notificationId

) => {

    try {

        return await Notification.findByIdAndUpdate(

            notificationId,

            {

                isRead: true,

            },

            {

                new: true,

            }

        );

    }

    catch (error) {

        console.error(

            "[Notification Read Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Mark All Read
========================================================================== */

const markAllAsRead = async (

    userId

) => {

    try {

        return await Notification.updateMany(

            {

                userId,

                isRead: false,

            },

            {

                isRead: true,

            }

        );

    }

    catch (error) {

        console.error(

            "[Notification ReadAll Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Delete Notification
========================================================================== */

const deleteNotification = async (

    notificationId

) => {

    try {

        return await Notification.findByIdAndDelete(

            notificationId

        );

    }

    catch (error) {

        console.error(

            "[Notification Delete Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * services/notificationService.js
 * Part 3
 * Archive + Statistics + Cleanup
 ******************************************************************************/

/* ==========================================================================
   Archive Notification
========================================================================== */

const archiveNotification = async (

    notificationId

) => {

    try {

        return await Notification.findByIdAndUpdate(

            notificationId,

            {

                isArchived: true,

            },

            {

                new: true,

            }

        );

    }

    catch (error) {

        console.error(

            "[Notification Archive Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Notification Statistics
========================================================================== */

const getNotificationStatistics = async (

    userId

) => {

    try {

        const total = await Notification.countDocuments({

            userId,

        });

        const unread = await Notification.countDocuments({

            userId,

            isRead: false,

            isArchived: false,

        });

        const archived = await Notification.countDocuments({

            userId,

            isArchived: true,

        });

        const critical = await Notification.countDocuments({

            userId,

            priority: "critical",

            isArchived: false,

        });

        const high = await Notification.countDocuments({

            userId,

            priority: "high",

            isArchived: false,

        });

        const ai = await Notification.countDocuments({

            userId,

            category: "ai",

            isArchived: false,

        });

        return {

            total,

            unread,

            archived,

            critical,

            high,

            ai,

        };

    }

    catch (error) {

        console.error(

            "[Notification Statistics Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Cleanup Expired Notifications
========================================================================== */

const cleanupExpiredNotifications = async () => {

    try {

        const result =

            await Notification.deleteMany({

                expiresAt: {

                    $ne: null,

                    $lte: new Date(),

                },

            });

        return {

            success: true,

            deleted:

                result.deletedCount,

        };

    }

    catch (error) {

        console.error(

            "[Notification Cleanup Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * services/notificationService.js
 * Part 4
 * Search + Filters + Export
 ******************************************************************************/

/* ==========================================================================
   Search Notifications
========================================================================== */

const searchNotifications = async (

    userId,

    search = ""

) => {

    try {

        return await Notification.find({

            userId,

            isArchived: false,

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

            ],

        })

        .sort({

            createdAt: -1,

        });

    }

    catch (error) {

        console.error(

            "[Notification Search Error]",

            error.message

        );

        throw error;

    }

};

/* ==========================================================================
   Filter Notifications
========================================================================== */

const filterNotifications = async (

    userId,

    filters = {}

) => {

    try {

        const query = {

            userId,

            isArchived: false,

        };

        if (filters.type) {

            query.type = filters.type;

        }

        if (filters.category) {

            query.category = filters.category;

        }

        if (filters.priority) {

            query.priority = filters.priority;

        }

        if (

            filters.isRead !== undefined

        ) {

            query.isRead = filters.isRead;

        }

        return await Notification.find(query)

            .sort({

                createdAt: -1,

            });

    }

    catch (error) {

        console.error(

            "[Notification Filter Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    createNotification,

    createAINotification,

    getNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification,

    archiveNotification,

    getNotificationStatistics,

    cleanupExpiredNotifications,

    searchNotifications,

    filterNotifications,

};

/******************************************************************************
 * End services/notificationService.js
 ******************************************************************************/

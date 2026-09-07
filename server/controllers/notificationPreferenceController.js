/******************************************************************************
 * controllers/notificationPreferenceController.js
 * Part 1
 * Imports + Helpers + Response Utilities
 ******************************************************************************/

/* ==========================================================================
   Models
========================================================================== */

const NotificationPreference = require("../models/NotificationPreference");

/* ==========================================================================
   Services
========================================================================== */

const pushNotificationService =
    require("../services/pushNotificationService");

const emailNotificationService =
    require("../services/emailNotificationService");

/* ==========================================================================
   Response Helpers
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

        timestamp:
            new Date().toISOString(),

    });

};

const errorResponse = (

    res,

    error,

    status = 500

) => {

    console.error(

        "[NotificationPreferenceController]",

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
   Helper Methods
========================================================================== */

const now = () =>
    new Date().toISOString();

/******************************************************************************
 * Find User Preferences
 ******************************************************************************/

const getUserPreference = async (

    userId

) => {

    let preference =

        await NotificationPreference.findOne({

            userId,

        });

    if (!preference) {

        preference =
            await NotificationPreference.create({

                userId,

            });

    }

    return preference;

};

/******************************************************************************
 * Validate User
 ******************************************************************************/

const validateUser = (req) => {

    if (!req.user || !req.user._id) {

        throw new Error(

            "User authentication required."

        );

    }

    return req.user._id;

};

/******************************************************************************
 * Controller Starts
 ******************************************************************************/
/******************************************************************************
 * Get Notification Preferences
 ******************************************************************************/

const getNotificationPreferences = async (req, res) => {

    try {

        const userId = validateUser(req);

        const preference =

            await getUserPreference(userId);

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Notification preferences loaded successfully."

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
 * Reset Notification Preferences
 ******************************************************************************/

const resetNotificationPreferences = async (req, res) => {

    try {

        const userId = validateUser(req);

        await NotificationPreference.findOneAndDelete({

            userId,

        });

        const preference =

            await NotificationPreference.create({

                userId,

            });

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Notification preferences reset successfully."

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
 * Get Push Notification Status
 ******************************************************************************/

const getPushStatus = async (req, res) => {

    try {

        const userId = validateUser(req);

        const result =

            await pushNotificationService.validateUserSubscription(

                userId

            );

        return successResponse(

            res,

            {

                push: result,

                generatedAt: now(),

            },

            "Push notification status loaded."

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
 * Get Email Notification Status
 ******************************************************************************/

const getEmailStatus = async (req, res) => {

    try {

        const health =

            await emailNotificationService.emailNotificationHealth();

        return successResponse(

            res,

            {

                email: health,

                generatedAt: now(),

            },

            "Email notification service status loaded."

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
 * Update Desktop Notification Preferences
 ******************************************************************************/

const updateDesktopPreference = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            enabled,

            sound,

        } = req.body;

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "desktop.enabled": enabled,

                        "desktop.sound": sound,

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Desktop notification preferences updated."

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
 * Update Email Notification Preferences
 ******************************************************************************/

const updateEmailPreference = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            enabled,

            dailyDigest,

            weeklyDigest,

        } = req.body;

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "email.enabled": enabled,

                        "email.dailyDigest": dailyDigest,

                        "email.weeklyDigest": weeklyDigest,

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Email notification preferences updated."

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
 * Update Push Notification Preferences
 ******************************************************************************/

const updatePushPreference = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            enabled,

            subscription,

        } = req.body;

        let preference;

        if (

            enabled &&

            subscription

        ) {

            await pushNotificationService.saveSubscription(

                userId,

                subscription

            );

        }

        else {

            await pushNotificationService.removeSubscription(

                userId

            );

        }

        preference =

            await NotificationPreference.findOne({

                userId,

            });

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Push notification preferences updated."

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
 * Update Quiet Hours
 ******************************************************************************/

const updateQuietHours = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            enabled,

            startTime,

            endTime,

            timezone,

        } = req.body;

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "quietHours.enabled": enabled,

                        "quietHours.startTime": startTime,

                        "quietHours.endTime": endTime,

                        "quietHours.timezone": timezone,

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Quiet hours updated successfully."

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
 * Update AI Notification Preferences
 ******************************************************************************/

const updateAIPreference = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            enabled,

            highPriorityOnly,

            confidenceThreshold,

        } = req.body;

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "ai.enabled": enabled,

                        "ai.highPriorityOnly": highPriorityOnly,

                        "ai.confidenceThreshold": confidenceThreshold,

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "AI notification preferences updated."

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
 * Update Dashboard Notification Preferences
 ******************************************************************************/

const updateDashboardPreference = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            enabled,

            autoRefresh,

            refreshInterval,

        } = req.body;

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "dashboard.enabled": enabled,

                        "dashboard.autoRefresh": autoRefresh,

                        "dashboard.refreshInterval": refreshInterval,

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Dashboard notification preferences updated."

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
 * Update Outlook Notification Preferences
 ******************************************************************************/

const updateOutlookPreference = async (req, res) => {

    try {

        const userId = validateUser(req);

        const {

            syncInterval,

            autoSync,

            signature,

        } = req.body;

        const preference =

            await NotificationPreference.findOneAndUpdate(

                {

                    userId,

                },

                {

                    $set: {

                        "outlook.syncInterval": syncInterval,

                        "outlook.autoSync": autoSync,

                        "outlook.signature": signature,

                    },

                },

                {

                    new: true,

                    upsert: true,

                }

            );

        return successResponse(

            res,

            {

                preference,

                generatedAt: now(),

            },

            "Outlook notification preferences updated."

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
 * Get Notification Preference Health
 ******************************************************************************/

const notificationPreferenceHealth = async (req, res) => {

    try {

        const totalUsers =

            await NotificationPreference.countDocuments();

        const desktopEnabled =

            await NotificationPreference.countDocuments({

                "desktop.enabled": true,

            });

        const emailEnabled =

            await NotificationPreference.countDocuments({

                "email.enabled": true,

            });

        const pushEnabled =

            await NotificationPreference.countDocuments({

                "push.enabled": true,

            });

        const quietHoursEnabled =

            await NotificationPreference.countDocuments({

                "quietHours.enabled": true,

            });

        return successResponse(

            res,

            {

                service: "Notification Preference",

                status: "healthy",

                statistics: {

                    totalUsers,

                    desktopEnabled,

                    emailEnabled,

                    pushEnabled,

                    quietHoursEnabled,

                },

                generatedAt: now(),

            },

            "Notification preference service is healthy."

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
 * Export Controller
 ******************************************************************************/

module.exports = {

    getNotificationPreferences,

    resetNotificationPreferences,

    getPushStatus,

    getEmailStatus,

    updateDesktopPreference,

    updateEmailPreference,

    updatePushPreference,

    updateQuietHours,

    updateAIPreference,

    updateDashboardPreference,

    updateOutlookPreference,

    notificationPreferenceHealth,

};

/******************************************************************************
 * End notificationPreferenceController.js
 ******************************************************************************/
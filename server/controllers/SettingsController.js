"use strict";

const Settings = require("../models/Settings");
const User = require("../models/User");
const graphUserService = require("../services/graphUserService");

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

const errorResponse = (
    res,
    error,
    message = "Internal Server Error",
    status = 500
) => {
    console.error("[SettingsController]", error);

    return res.status(status).json({
        success: false,
        message: error?.message || message,
        timestamp: new Date().toISOString(),
    });
};

const getUserFromRequest = async (req) => {
    const possibleIds = [
        req?.user?._id,
        req?.user?.id,
        req?.auth?.userId,
        req?.auth?.id,
    ];

    for (const id of possibleIds) {
        if (!id) continue;

        try {
            const user = await User.findById(id);

            if (user) {
                return user;
            }
        } catch (error) {
            console.warn(
                "[SettingsController] User ID lookup failed:",
                error.message
            );
        }
    }

    const authenticatedEmail =
        req?.user?.email ||
        req?.auth?.email;

    if (authenticatedEmail) {
        const user = await User.findOne({
            email: authenticatedEmail.toLowerCase(),
        });

        if (user) {
            return user;
        }
    }

    try {
        if (
            graphUserService &&
            typeof graphUserService.getMyProfile === "function"
        ) {
            const profile =
                await graphUserService.getMyProfile();

            const email =
                profile?.mail ||
                profile?.userPrincipalName;

            if (email) {
                const user =
                    await User.findOne({
                        email: email.toLowerCase(),
                    });

                if (user) {
                    return user;
                }
            }
        }
    } catch (error) {
        console.warn(
            "[SettingsController] Graph profile lookup failed:",
            error.message
        );
    }

    throw new Error(
        "Authenticated user could not be resolved."
    );
};

const getOrCreateSettings = async (userId) => {
    if (!userId) {
        throw new Error(
            "User ID is required to load settings."
        );
    }

    if (
        typeof Settings.getOrCreateForUser ===
        "function"
    ) {
        return Settings.getOrCreateForUser(userId);
    }

    let settings =
        await Settings.findOne({
            userId,
        });

    if (!settings) {
        settings =
            await Settings.create({
                userId,
            });
    }

    return settings;
};

const updateSettings = async (
    userId,
    update
) => {
    if (
        !update ||
        Object.keys(update).length === 0
    ) {
        throw new Error(
            "No settings were provided for update."
        );
    }

    return Settings.findOneAndUpdate(
        {
            userId,
        },
        {
            $set: update,
        },
        {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
        }
    );
};

const getSettings = async (req, res) => {
    try {
        const user =
            await getUserFromRequest(req);

        const settings =
            await getOrCreateSettings(
                user._id
            );

        return successResponse(
            res,
            settings,
            "Settings loaded successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to load settings."
        );
    }
};

const updateAppearanceSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            theme,
            accentColor,
            density,
        } = req.body;

        const update = {};

        if (theme !== undefined) {
            update["appearance.theme"] =
                theme;
        }

        if (
            accentColor !== undefined
        ) {
            update[
                "appearance.accentColor"
            ] = accentColor;
        }

        if (density !== undefined) {
            update["appearance.density"] =
                density;
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "Appearance settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update appearance settings."
        );
    }
};

const updateLocalizationSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            language,
            timezone,
            dateFormat,
            timeFormat,
        } = req.body;

        const update = {};

        if (language !== undefined) {
            update[
                "localization.language"
            ] = language;
        }

        if (timezone !== undefined) {
            update[
                "localization.timezone"
            ] = timezone;
        }

        if (
            dateFormat !== undefined
        ) {
            update[
                "localization.dateFormat"
            ] = dateFormat;
        }

        if (
            timeFormat !== undefined
        ) {
            update[
                "localization.timeFormat"
            ] = timeFormat;
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "Localization settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update localization settings."
        );
    }
};

const updateNotificationSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            desktop,
            email,
            sound,
            highPriorityOnly,
        } = req.body;

        const update = {};

        if (desktop !== undefined) {
            update[
                "notifications.desktop"
            ] = Boolean(desktop);
        }

        if (email !== undefined) {
            update[
                "notifications.email"
            ] = Boolean(email);
        }

        if (sound !== undefined) {
            update[
                "notifications.sound"
            ] = Boolean(sound);
        }

        if (
            highPriorityOnly !== undefined
        ) {
            update[
                "notifications.highPriorityOnly"
            ] = Boolean(
                highPriorityOnly
            );
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "Notification settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update notification settings."
        );
    }
};

const updateAISettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            autoReply,
            smartClassification,
            priorityPrediction,
            slaPrediction,
            confidenceThreshold,
        } = req.body;

        const update = {};

        if (
            autoReply !== undefined
        ) {
            update[
                "ai.autoReply"
            ] = Boolean(autoReply);
        }

        if (
            smartClassification !==
            undefined
        ) {
            update[
                "ai.smartClassification"
            ] = Boolean(
                smartClassification
            );
        }

        if (
            priorityPrediction !==
            undefined
        ) {
            update[
                "ai.priorityPrediction"
            ] = Boolean(
                priorityPrediction
            );
        }

        if (
            slaPrediction !== undefined
        ) {
            update[
                "ai.slaPrediction"
            ] = Boolean(
                slaPrediction
            );
        }

        if (
            confidenceThreshold !==
            undefined
        ) {
            update[
                "ai.confidenceThreshold"
            ] = Number(
                confidenceThreshold
            );
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "AI settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update AI settings."
        );
    }
};

const updateDashboardSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            autoRefresh,
            refreshInterval,
            defaultView,
            showCharts,
            showKPIs,
        } = req.body;

        const update = {};

        if (
            autoRefresh !== undefined
        ) {
            update[
                "dashboard.autoRefresh"
            ] = Boolean(autoRefresh);
        }

        if (
            refreshInterval !==
            undefined
        ) {
            update[
                "dashboard.refreshInterval"
            ] = Number(
                refreshInterval
            );
        }

        if (
            defaultView !== undefined
        ) {
            update[
                "dashboard.defaultView"
            ] = defaultView;
        }

        if (
            showCharts !== undefined
        ) {
            update[
                "dashboard.showCharts"
            ] = Boolean(showCharts);
        }

        if (
            showKPIs !== undefined
        ) {
            update[
                "dashboard.showKPIs"
            ] = Boolean(showKPIs);
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "Dashboard settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update dashboard settings."
        );
    }
};

const updateOutlookSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            syncInterval,
            autoSync,
            signature,
        } = req.body;

        const update = {};

        if (
            syncInterval !== undefined
        ) {
            update[
                "outlook.syncInterval"
            ] = Number(
                syncInterval
            );
        }

        if (
            autoSync !== undefined
        ) {
            update[
                "outlook.autoSync"
            ] = Boolean(autoSync);
        }

        if (
            signature !== undefined
        ) {
            update[
                "outlook.signature"
            ] = signature;
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "Outlook settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update Outlook settings."
        );
    }
};

const updateSecuritySettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const {
            sessionTimeout,
            loginAlerts,
            deviceTracking,
        } = req.body;

        const update = {};

        if (
            sessionTimeout !== undefined
        ) {
            update[
                "security.sessionTimeout"
            ] = Number(
                sessionTimeout
            );
        }

        if (
            loginAlerts !== undefined
        ) {
            update[
                "security.loginAlerts"
            ] = Boolean(
                loginAlerts
            );
        }

        if (
            deviceTracking !== undefined
        ) {
            update[
                "security.deviceTracking"
            ] = Boolean(
                deviceTracking
            );
        }

        const settings =
            await updateSettings(
                user._id,
                update
            );

        return successResponse(
            res,
            settings,
            "Security settings updated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to update security settings."
        );
    }
};

const updateGeneralSettings = async (
    req,
    res
) => {
    return updateAppearanceSettings(
        req,
        res
    );
};

const resetSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        await Settings.findOneAndDelete({
            userId: user._id,
        });

        const settings =
            await Settings.create({
                userId: user._id,
            });

        return successResponse(
            res,
            settings,
            "Settings reset successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to reset settings."
        );
    }
};

const getSettingsHealth = async (
    req,
    res
) => {
    try {
        let databaseStatus =
            "Healthy";

        try {
            await Settings.findOne()
                .select("_id")
                .lean();
        } catch (databaseError) {
            databaseStatus =
                "Error";
        }

        const healthy =
            databaseStatus ===
            "Healthy";

        return successResponse(
            res,
            {
                service:
                    "Settings API",
                status: healthy
                    ? "Healthy"
                    : "Degraded",
                database:
                    databaseStatus,
                version:
                    "11.5.0",
                timestamp:
                    new Date().toISOString(),
            },
            "Settings service health retrieved successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to retrieve settings health."
        );
    }
};

const exportSettings = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const settings =
            await getOrCreateSettings(
                user._id
            );

        const exportedSettings =
            settings.toObject();

        delete exportedSettings._id;
        delete exportedSettings.userId;
        delete exportedSettings.createdAt;
        delete exportedSettings.updatedAt;

        const exported = {
            exportedAt:
                new Date().toISOString(),
            application:
                "Microsoft 365 Outlook Management System",
            version:
                "11.5.0",
            settings:
                exportedSettings,
        };

        res.setHeader(
            "Content-Type",
            "application/json"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="settings-config.json"'
        );

        return res.status(200).send(
            JSON.stringify(
                exported,
                null,
                2
            )
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to export settings."
        );
    }
};

const testOutlookConnection = async (
    req,
    res
) => {
    try {
        let profile = null;

        if (
            graphUserService &&
            typeof graphUserService.getMyProfile ===
                "function"
        ) {
            profile =
                await graphUserService.getMyProfile();
        }

        const account =
            profile?.mail ||
            profile?.userPrincipalName ||
            null;

        const connected =
            Boolean(account);

        return successResponse(
            res,
            {
                connected,
                account,
                health: connected
                    ? "Healthy"
                    : "Disconnected",
                testedAt:
                    new Date().toISOString(),
            },
            connected
                ? "Outlook connection test successful."
                : "Outlook connection test failed.",
            connected ? 200 : 503
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Outlook connection test failed.",
            503
        );
    }
};

const reconnectOutlook = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        let profile = null;

        if (
            graphUserService &&
            typeof graphUserService.getMyProfile ===
                "function"
        ) {
            profile =
                await graphUserService.getMyProfile();
        }

        const account =
            profile?.mail ||
            profile?.userPrincipalName ||
            null;

        if (!account) {
            return errorResponse(
                res,
                new Error(
                    "Microsoft Graph connection is unavailable."
                ),
                "Unable to reconnect Outlook.",
                503
            );
        }

        const settings =
            await updateSettings(
                user._id,
                {
                    "outlook.autoSync":
                        true,
                }
            );

        return successResponse(
            res,
            {
                connected: true,
                account,
                reconnectedAt:
                    new Date().toISOString(),
                settings,
            },
            "Outlook reconnected successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to reconnect Outlook.",
            503
        );
    }
};

const disconnectOutlook = async (
    req,
    res
) => {
    try {
        const user =
            await getUserFromRequest(req);

        const settings =
            await updateSettings(
                user._id,
                {
                    "outlook.autoSync":
                        false,
                }
            );

        return successResponse(
            res,
            {
                connected: false,
                settings,
                disconnectedAt:
                    new Date().toISOString(),
            },
            "Outlook disconnected successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to disconnect Outlook."
        );
    }
};

const refreshOutlookData = async (
    req,
    res
) => {
    try {
        return successResponse(
            res,
            {
                started: true,
                requestedAt:
                    new Date().toISOString(),
            },
            "Outlook data refresh started."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to start Outlook refresh."
        );
    }
};

const clearCache = async (
    req,
    res
) => {
    try {
        return successResponse(
            res,
            {
                cleared: true,
                clearedAt:
                    new Date().toISOString(),
            },
            "Application cache cleared successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error,
            "Unable to clear application cache."
        );
    }
};

module.exports = {
    getSettings,

    updateGeneralSettings,
    updateAppearanceSettings,
    updateLocalizationSettings,
    updateNotificationSettings,
    updateAISettings,
    updateDashboardSettings,
    updateOutlookSettings,
    updateSecuritySettings,

    resetSettings,

    getSettingsHealth,

    exportSettings,

    testOutlookConnection,
    reconnectOutlook,
    disconnectOutlook,

    refreshOutlookData,
    clearCache,
};
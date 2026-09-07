"use strict";

const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/settingsController");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

router.use(authenticate);

router.get(
    "/",
    authorize("settings.read"),
    getSettings
);

router.put(
    "/general",
    authorize("settings.update"),
    updateGeneralSettings
);

router.put(
    "/appearance",
    authorize("settings.update"),
    updateAppearanceSettings
);

router.put(
    "/localization",
    authorize("settings.update"),
    updateLocalizationSettings
);

router.put(
    "/notifications",
    authorize("settings.update"),
    updateNotificationSettings
);

router.put(
    "/ai",
    authorize("settings.update"),
    updateAISettings
);

router.put(
    "/dashboard",
    authorize("settings.update"),
    updateDashboardSettings
);

router.put(
    "/outlook",
    authorize("settings.update"),
    updateOutlookSettings
);

router.put(
    "/security",
    authorize("settings.update"),
    updateSecuritySettings
);

router.post(
    "/reset",
    authorize("settings.update"),
    resetSettings
);

router.get(
    "/export",
    authorize("settings.read"),
    exportSettings
);

router.post(
    "/test-connection",
    authorize("settings.update"),
    testOutlookConnection
);

router.post(
    "/reconnect",
    authorize("settings.update"),
    reconnectOutlook
);

router.post(
    "/disconnect",
    authorize("settings.update"),
    disconnectOutlook
);

router.post(
    "/refresh-outlook",
    authorize("settings.update"),
    refreshOutlookData
);

router.post(
    "/clear-cache",
    authorize("settings.update"),
    clearCache
);

router.get(
    "/health",
    authorize("settings.read"),
    getSettingsHealth
);

router.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Settings route not found.",
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
    });
});

module.exports = router;
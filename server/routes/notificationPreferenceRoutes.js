/******************************************************************************
 * routes/notificationPreferenceRoutes.js
 * Part 1
 * Imports + Router + Controllers
 ******************************************************************************/

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Controllers
========================================================================== */

const {

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

} = require(

    "../controllers/notificationPreferenceController"

);

/* ==========================================================================
   Authentication Middleware
========================================================================== */

const authMiddleware =

    require("../middlewares/authMiddleware");

/******************************************************************************
 * All routes below require authentication
 ******************************************************************************/

router.use(

    authMiddleware

);

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Notification Preference Routes
 * Basic APIs
 ******************************************************************************/

/* ==========================================================================
   Get Notification Preferences
   GET /api/notification-preferences
========================================================================== */

router.get(

    "/",

    getNotificationPreferences

);

/* ==========================================================================
   Reset Notification Preferences
   POST /api/notification-preferences/reset
========================================================================== */

router.post(

    "/reset",

    resetNotificationPreferences

);

/* ==========================================================================
   Get Push Notification Status
   GET /api/notification-preferences/push/status
========================================================================== */

router.get(

    "/push/status",

    getPushStatus

);

/* ==========================================================================
   Get Email Notification Status
   GET /api/notification-preferences/email/status
========================================================================== */

router.get(

    "/email/status",

    getEmailStatus

);

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Update Desktop Notification Preferences
 * PUT /api/notification-preferences/desktop
 ******************************************************************************/

router.put(

    "/desktop",

    updateDesktopPreference

);

/******************************************************************************
 * Update Email Notification Preferences
 * PUT /api/notification-preferences/email
 ******************************************************************************/

router.put(

    "/email",

    updateEmailPreference

);

/******************************************************************************
 * Update Push Notification Preferences
 * PUT /api/notification-preferences/push
 ******************************************************************************/

router.put(

    "/push",

    updatePushPreference

);

/******************************************************************************
 * Update Quiet Hours
 * PUT /api/notification-preferences/quiet-hours
 ******************************************************************************/

router.put(

    "/quiet-hours",

    updateQuietHours

);

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Update AI Notification Preferences
 * PUT /api/notification-preferences/ai
 ******************************************************************************/

router.put(

    "/ai",

    updateAIPreference

);

/******************************************************************************
 * Update Dashboard Notification Preferences
 * PUT /api/notification-preferences/dashboard
 ******************************************************************************/

router.put(

    "/dashboard",

    updateDashboardPreference

);

/******************************************************************************
 * Update Outlook Notification Preferences
 * PUT /api/notification-preferences/outlook
 ******************************************************************************/

router.put(

    "/outlook",

    updateOutlookPreference

);

/******************************************************************************
 * Notification Preference Health
 * GET /api/notification-preferences/health
 ******************************************************************************/

router.get(

    "/health",

    notificationPreferenceHealth

);

/******************************************************************************
 * Export Router
 ******************************************************************************/

module.exports = router;

/******************************************************************************
 * End notificationPreferenceRoutes.js
 ******************************************************************************/
/******************************************************************************
 * notificationRoutes.js
 * Part 1
 * Enterprise Notification Routes
 ******************************************************************************/

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Controllers
========================================================================== */

const {

  getNotifications,

  getUnreadNotifications,

  markNotificationAsRead,

  markAllNotificationsAsRead,

  deleteNotification,

  clearNotifications,

  getNotificationStats,

} = require("../controllers/notificationController");

/* ==========================================================================
   Middlewares
========================================================================== */

const authenticate =
  require("../middleware/authMiddleware");

const authorize =
  require("../middleware/authorize");

const validate =
  require("../middleware/validate");

/******************************************************************************
 * Global Authentication
 ******************************************************************************/

router.use(authenticate);
/******************************************************************************
 * Get All Notifications
 ******************************************************************************/

router.get(

  "/",

  authorize("notifications.read"),

  getNotifications

);

/******************************************************************************
 * Get Unread Notifications
 ******************************************************************************/

router.get(

  "/unread",

  authorize("notifications.read"),

  getUnreadNotifications

);

/******************************************************************************
 * Notification Statistics
 ******************************************************************************/

router.get(

  "/stats",

  authorize("notifications.read"),

  getNotificationStats

);
/******************************************************************************
 * Mark Notification As Read
 ******************************************************************************/

router.patch(

  "/:notificationId/read",

  authorize("notifications.update"),

  markNotificationAsRead

);

/******************************************************************************
 * Mark All Notifications As Read
 ******************************************************************************/

router.patch(

  "/read-all",

  authorize("notifications.update"),

  markAllNotificationsAsRead

);
/******************************************************************************
 * Delete Notification
 ******************************************************************************/

router.delete(

  "/:notificationId",

  authorize("notifications.delete"),

  deleteNotification

);

/******************************************************************************
 * Clear All Notifications
 ******************************************************************************/

router.delete(

  "/clear",

  authorize("notifications.delete"),

  clearNotifications

);
/******************************************************************************
 * Notification Health
 ******************************************************************************/

router.get(

  "/health",

  (req, res) => {

    return res.status(200).json({

      success: true,

      service: "Notification API",

      status: "Healthy",

      version: "1.0.0",

      timestamp:

        new Date().toISOString(),

    });

  }

);

/******************************************************************************
 * Route Metadata
 ******************************************************************************/

router.get(

  "/meta",

  authorize("notifications.read"),

  (req, res) => {

    return res.status(200).json({

      success: true,

      module: "Notifications",

      version: "1.0.0",

      endpoints: [

        "GET /",

        "GET /unread",

        "GET /stats",

        "PATCH /:notificationId/read",

        "PATCH /read-all",

        "DELETE /:notificationId",

        "DELETE /clear",

        "GET /health",

        "GET /meta",

      ],

      timestamp:

        new Date().toISOString(),

    });

  }

);

/******************************************************************************
 * 404 Route Handler
 ******************************************************************************/

router.use(

  "*",

  (req, res) => {

    return res.status(404).json({

      success: false,

      message: "Notification route not found.",

      path: req.originalUrl,

      timestamp:

        new Date().toISOString(),

    });

  }

);

/******************************************************************************
 * Export Router
 ******************************************************************************/

module.exports = router;

/******************************************************************************
 * End notificationRoutes.js
 ******************************************************************************/
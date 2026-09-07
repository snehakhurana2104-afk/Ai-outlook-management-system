/******************************************************************************
 * routes/webhookRoutes.js
 * Enterprise Microsoft Graph Webhook Routes
 ******************************************************************************/

const express = require("express");

const router = express.Router();

/* ==========================================================================
   Controller
========================================================================== */

const {

  validateWebhook,

  createSubscription,

  renewSubscription,

  deleteSubscription,

  receiveNotifications,

  getSubscriptions,

  webhookHealth,

} = require("../controllers/webhookController");

/* ==========================================================================
   Middlewares
========================================================================== */

const authenticate =
  require("../middleware/authMiddleware");

const authorize =
  require("../middleware/authorize");

/******************************************************************************
 * Microsoft Graph Validation
 *
 * Graph calls:
 * GET /api/webhooks?validationToken=xxxx
 ******************************************************************************/

router.get(
  "/",
  validateWebhook
);

/******************************************************************************
 * Receive Graph Notifications
 *
 * Graph calls:
 * POST /api/webhooks
 ******************************************************************************/

router.post(
  "/",
  receiveNotifications
);

/******************************************************************************
 * Health Check
 ******************************************************************************/

router.get(
  "/health",
  authenticate,
  authorize("Admin"),
  webhookHealth
);

/******************************************************************************
 * Get Active Subscriptions
 ******************************************************************************/

router.get(
  "/subscriptions",
  authenticate,
  authorize("Admin"),
  getSubscriptions
);

/******************************************************************************
 * Create Subscription
 ******************************************************************************/

router.post(
  "/subscriptions",
  authenticate,
  authorize("Admin"),
  createSubscription
);

/******************************************************************************
 * Renew Subscription
 ******************************************************************************/

router.patch(
  "/subscriptions/:subscriptionId",
  authenticate,
  authorize("Admin"),
  renewSubscription
);

/******************************************************************************
 * Delete Subscription
 ******************************************************************************/

router.delete(
  "/subscriptions/:subscriptionId",
  authenticate,
  authorize("Admin"),
  deleteSubscription
);

/******************************************************************************
 * Test Endpoint
 ******************************************************************************/

router.get(
  "/ping",
  (req, res) => {

    return res.status(200).json({

      success: true,

      service: "Webhook API",

      message: "Webhook route is running.",

      timestamp: new Date().toISOString(),

    });

  }
);

/******************************************************************************
 * 404 Handler
 ******************************************************************************/

router.use("*", (req, res) => {

  return res.status(404).json({

    success: false,

    message: "Webhook route not found.",

    path: req.originalUrl,

    timestamp: new Date().toISOString(),

  });

});

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = router;
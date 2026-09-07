/******************************************************************************
 * webhookController.js
 * Part 1
 * Enterprise Microsoft Graph Webhook Controller
 ******************************************************************************/

const crypto = require("crypto");
const axios = require("axios");

const Email = require("../models/Email");
const User = require("../models/User");

/* ==========================================================================
   Services
========================================================================== */

const graphService =
  require("../services/graphService");

const authService =
  require("../services/authService");

/* ==========================================================================
   Configuration
========================================================================== */

const GRAPH_BASE_URL =
  process.env.GRAPH_BASE_URL ||
  "https://graph.microsoft.com/v1.0";

const CLIENT_STATE =
  process.env.GRAPH_CLIENT_STATE ||
  "AI_OUTLOOK_SECRET";

const SUBSCRIPTION_EXPIRY_HOURS = 24;

/* ==========================================================================
   Enterprise Response Helpers
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

    "[WebhookController]",

    error

  );

  return res.status(status).json({

    success: false,

    message:
      error.message ||
      "Internal Server Error",

    timestamp:
      new Date().toISOString(),

  });

};

/* ==========================================================================
   Helpers
========================================================================== */

const generateClientState = () => {

  return crypto
    .randomBytes(32)
    .toString("hex");

};

const getSubscriptionExpiration = () => {

  const expires = new Date();

  expires.setHours(

    expires.getHours() +
    SUBSCRIPTION_EXPIRY_HOURS

  );

  return expires.toISOString();

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * validateWebhook()
 * Microsoft Graph Validation Endpoint
 ******************************************************************************/

const validateWebhook = async (req, res) => {

  try {

    /*
     * Microsoft Graph sends:
     * ?validationToken=xxxxxxxx
     */

    const validationToken =
      req.query.validationToken;

    if (validationToken) {

      console.info(

        "[Webhook] Validation Request Received"

      );

      /*
       * Graph expects plain text
       */

      return res
        .status(200)
        .set("Content-Type", "text/plain")
        .send(validationToken);

    }

    return successResponse(

      res,

      {

        status:
          "Validation Completed",

      },

      "Webhook validated successfully."

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
 * createSubscription()
 ******************************************************************************/

const createSubscription = async (req, res) => {

  try {

    const accessToken =
      await authService.getAccessToken();

    const payload = {

      changeType:
        "created,updated,deleted",

      notificationUrl:
        process.env.GRAPH_NOTIFICATION_URL,

      resource:
        "/me/messages",

      expirationDateTime:
        getSubscriptionExpiration(),

      clientState:
        CLIENT_STATE,

    };

    const response =
      await axios.post(

        `${GRAPH_BASE_URL}/subscriptions`,

        payload,

        {

          headers: {

            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",

          },

        }

      );

    return successResponse(

      res,

      {

        subscription:
          response.data,

      },

      "Microsoft Graph subscription created successfully."

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
 * renewSubscription()
 ******************************************************************************/

const renewSubscription = async (req, res) => {

  try {

    const {

      subscriptionId,

    } = req.params;

    if (!subscriptionId) {

      return res.status(400).json({

        success: false,

        message:

          "Subscription Id is required.",

      });

    }

    const accessToken =
      await authService.getAccessToken();

    const payload = {

      expirationDateTime:
        getSubscriptionExpiration(),

    };

    const response =
      await axios.patch(

        `${GRAPH_BASE_URL}/subscriptions/${subscriptionId}`,

        payload,

        {

          headers: {

            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",

          },

        }

      );

    return successResponse(

      res,

      {

        subscription:
          response.data,

      },

      "Subscription renewed successfully."

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
 * deleteSubscription()
 ******************************************************************************/

const deleteSubscription = async (req, res) => {

  try {

    const {

      subscriptionId,

    } = req.params;

    if (!subscriptionId) {

      return res.status(400).json({

        success: false,

        message:

          "Subscription Id is required.",

      });

    }

    const accessToken =
      await authService.getAccessToken();

    await axios.delete(

      `${GRAPH_BASE_URL}/subscriptions/${subscriptionId}`,

      {

        headers: {

          Authorization:
            `Bearer ${accessToken}`,

        },

      }

    );

    return successResponse(

      res,

      {

        subscriptionId,

        deletedAt:
          new Date().toISOString(),

      },

      "Subscription deleted successfully."

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
 * receiveNotifications()
 ******************************************************************************/

const receiveNotifications = async (req, res) => {

  try {

    const notifications =
      req.body.value || [];

    if (!notifications.length) {

      return successResponse(

        res,

        {},

        "No notifications received."

      );

    }

    for (const notification of notifications) {

      /*
       * Validate Client State
       */

      if (

        notification.clientState !==

        CLIENT_STATE

      ) {

        console.warn(

          "[Webhook] Invalid Client State"

        );

        continue;

      }

      /*
       * Process Notification
       */

      await processNotification(

        notification

      );

    }

    return successResponse(

      res,

      {

        processed:

          notifications.length,

      },

      "Notifications processed successfully."

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
 * processNotification()
 ******************************************************************************/

const processNotification = async (

  notification

) => {

  try {

    const accessToken =
      await authService.getAccessToken();

    /*
     * Get Latest Email
     */

    const response =
      await axios.get(

        `${GRAPH_BASE_URL}${notification.resource}`,

        {

          headers: {

            Authorization:

              `Bearer ${accessToken}`,

          },

        }

      );

    const graphEmail =
      response.data;

    /*
     * Upsert Email
     */

    await Email.findOneAndUpdate(

      {

        messageId:

          graphEmail.id,

      },

      {

        $set: {

          messageId:

            graphEmail.id,

          subject:

            graphEmail.subject,

          from:

            graphEmail.from

              ?.emailAddress

              ?.address,

          sender:

            graphEmail.sender

              ?.emailAddress

              ?.address,

          receivedDateTime:

            graphEmail.receivedDateTime,

          isRead:

            graphEmail.isRead,

          importance:

            graphEmail.importance,

          bodyPreview:

            graphEmail.bodyPreview,

          conversationId:

            graphEmail.conversationId,

          updatedAt:

            new Date(),

        },

      },

      {

        upsert: true,

        new: true,

      }

    );

    /*
     * Socket.IO (Optional)
     */

    if (global.io) {

      global.io.emit(

        "email:updated",

        {

          messageId:

            graphEmail.id,

          subject:

            graphEmail.subject,

          receivedDateTime:

            graphEmail.receivedDateTime,

        }

      );

    }

    return true;

  }

  catch (error) {

    console.error(

      "[Webhook Notification Error]",

      error.message

    );

    return false;

  }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * getSubscriptions()
 ******************************************************************************/

const getSubscriptions = async (req, res) => {

  try {

    const accessToken =
      await authService.getAccessToken();

    const response =
      await axios.get(

        `${GRAPH_BASE_URL}/subscriptions`,

        {

          headers: {

            Authorization:
              `Bearer ${accessToken}`,

          },

        }

      );

    return successResponse(

      res,

      {

        total:
          response.data.value.length,

        subscriptions:
          response.data.value,

      },

      "Subscriptions retrieved successfully."

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
 * webhookHealth()
 ******************************************************************************/

const webhookHealth = async (req, res) => {

  try {

    const accessToken =
      await authService.getAccessToken();

    const response =
      await axios.get(

        `${GRAPH_BASE_URL}/subscriptions`,

        {

          headers: {

            Authorization:
              `Bearer ${accessToken}`,

          },

        }

      );

    return successResponse(

      res,

      {

        service:
          "Microsoft Graph Webhook",

        status:
          "Healthy",

        activeSubscriptions:
          response.data.value.length,

        graphConnected:
          true,

        checkedAt:
          new Date().toISOString(),

      },

      "Webhook service is healthy."

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
 * Export
 ******************************************************************************/

module.exports = {

  validateWebhook,

  createSubscription,

  renewSubscription,

  deleteSubscription,

  receiveNotifications,

  processNotification,

  getSubscriptions,

  webhookHealth,

};

/******************************************************************************
 * End webhookController.js
 ******************************************************************************/
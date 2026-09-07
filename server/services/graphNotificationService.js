/******************************************************************************
 * graphNotificationService.js
 * Part 1
 * Microsoft Graph Notification Service
 ******************************************************************************/

const axios = require("axios");

/* ==========================================================================
   Configuration
========================================================================== */

const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

const DEFAULT_TIMEOUT =
  Number(process.env.GRAPH_TIMEOUT || 30000);

const MAX_RETRIES =
  Number(process.env.GRAPH_MAX_RETRIES || 3);

/* ==========================================================================
   Graph Notification Service
========================================================================== */

class GraphNotificationService {

  constructor() {

    this.baseURL = GRAPH_BASE_URL;

    this.timeout = DEFAULT_TIMEOUT;

    this.maxRetries = MAX_RETRIES;

  }

  /* ==========================================================================
     Delay Helper
  ========================================================================== */

  sleep(ms) {

    return new Promise((resolve) => {

      setTimeout(resolve, ms);

    });

  }

  /* ==========================================================================
     Axios Client
  ========================================================================== */

  createClient(accessToken) {

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    return axios.create({

      baseURL: this.baseURL,

      timeout: this.timeout,

      headers: {

        Authorization: `Bearer ${accessToken}`,

        "Content-Type": "application/json",

      },

    });

  }

  /* ==========================================================================
     Retry Wrapper
  ========================================================================== */

  async execute(requestFn) {

    let lastError = null;

    for (

      let attempt = 1;

      attempt <= this.maxRetries;

      attempt++

    ) {

      try {

        return await requestFn();

      }

      catch (error) {

        lastError = error;

        console.error(

          `[Graph Notification Attempt ${attempt}]`,

          error.message

        );

        if (attempt < this.maxRetries) {

          await this.sleep(

            attempt * 1000

          );

        }

      }

    }

    throw lastError;

  }
  /******************************************************************************
 * graphNotificationService.js
 * Part 2
 * Create Subscription + Get Subscriptions
 *
 * Paste INSIDE GraphNotificationService class
 ******************************************************************************/

/* ==========================================================================
   Create Subscription
========================================================================== */

async createSubscription({

  accessToken,

  changeType,

  notificationUrl,

  resource,

  expirationDateTime,

  clientState,

}) {

  if (!changeType) {

    throw new Error(
      "Change type is required."
    );

  }

  if (!notificationUrl) {

    throw new Error(
      "Notification URL is required."
    );

  }

  if (!resource) {

    throw new Error(
      "Resource is required."
    );

  }

  if (!expirationDateTime) {

    throw new Error(
      "Expiration date is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        changeType,

        notificationUrl,

        resource,

        expirationDateTime,

        clientState,

      };

      const response =
        await client.post(

          "/subscriptions",

          payload

        );

      return {

        success: true,

        subscription:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get All Subscriptions
========================================================================== */

async getSubscriptions({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/subscriptions"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        subscriptions:
          response.data.value,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphNotificationService.js
 * Part 3
 * Get Subscription + Renew Subscription
 *
 * Paste INSIDE GraphNotificationService class
 ******************************************************************************/

/* ==========================================================================
   Get Subscription By Id
========================================================================== */

async getSubscription({

  accessToken,

  subscriptionId,

}) {

  if (!subscriptionId) {

    throw new Error(
      "Subscription Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/subscriptions/${subscriptionId}`

        );

      return {

        success: true,

        subscription:
          response.data,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Renew Subscription
========================================================================== */

async renewSubscription({

  accessToken,

  subscriptionId,

  expirationDateTime,

}) {

  if (!subscriptionId) {

    throw new Error(
      "Subscription Id is required."
    );

  }

  if (!expirationDateTime) {

    throw new Error(
      "Expiration date is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          `/subscriptions/${subscriptionId}`,

          {

            expirationDateTime,

          }

        );

      return {

        success: true,

        subscriptionId,

        subscription:
          response.data,

        renewedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphNotificationService.js
 * Part 4
 * Delete Subscription + Get Notification Summary
 *
 * Paste INSIDE GraphNotificationService class
 ******************************************************************************/

/* ==========================================================================
   Delete Subscription
========================================================================== */

async deleteSubscription({

  accessToken,

  subscriptionId,

}) {

  if (!subscriptionId) {

    throw new Error(
      "Subscription Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/subscriptions/${subscriptionId}`

      );

      return {

        success: true,

        subscriptionId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Notification Summary
========================================================================== */

async getNotificationSummary({

  accessToken,

}) {

  const subscriptions =
    await this.getSubscriptions({

      accessToken,

    });

  const activeSubscriptions =

    (subscriptions.subscriptions || []).filter(

      (subscription) =>

        new Date(

          subscription.expirationDateTime

        ) > new Date()

    );

  return {

    success: true,

    summary: {

      total:

        subscriptions.total || 0,

      active:

        activeSubscriptions.length,

      expired:

        (subscriptions.total || 0) -

        activeSubscriptions.length,

    },

    subscriptions:

      subscriptions.subscriptions || [],

    generatedAt:
      new Date().toISOString(),

  };

}
/******************************************************************************
 * graphNotificationService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphNotificationService class
 ******************************************************************************/

/* ==========================================================================
   Health Check
========================================================================== */

async healthCheck({

  accessToken,

}) {

  try {

    const client =
      this.createClient(accessToken);

    const response =
      await client.get(

        "/subscriptions"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Notification Service",

      status:
        "Healthy",

      totalSubscriptions:
        response.data.value.length,

      checkedAt:
        new Date().toISOString(),

    };

  }

  catch (error) {

    return this.mapGraphError(error);

  }

}

/* ==========================================================================
   Enterprise Error Mapping
========================================================================== */

mapGraphError(error) {

  return {

    success: false,

    status:

      error?.response?.status ||

      500,

    code:

      error?.response?.data?.error?.code ||

      "GRAPH_ERROR",

    message:

      error?.response?.data?.error?.message ||

      error.message ||

      "Microsoft Graph Error",

  };

}

/* ==========================================================================
   Service Information
========================================================================== */

getServiceInfo() {

  return {

    provider:
      "Microsoft Graph",

    service:
      "Notification Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Create Subscription",

      "Get Subscriptions",

      "Get Subscription",

      "Renew Subscription",

      "Delete Subscription",

      "Notification Summary",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphNotificationService =
  new GraphNotificationService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphNotificationService initialized."

  );

}

catch (error) {

  console.error(

    "[Microsoft Graph]",

    error.message

  );

}

/* ==========================================================================
   Export
========================================================================== */

module.exports =
  graphNotificationService;

/******************************************************************************
 * End graphNotificationService.js
 ******************************************************************************/
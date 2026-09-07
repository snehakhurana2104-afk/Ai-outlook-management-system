/******************************************************************************
 * graphSubscriptionService.js
 * Part 1
 * Microsoft Graph Subscription (Webhook) Service
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
   Graph Subscription Service
========================================================================== */

class GraphSubscriptionService {

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

          `[Graph Subscription Attempt ${attempt}]`,

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

  }/******************************************************************************
 * graphSubscriptionService.js
 * Part 2
 * Create Subscription + Get Subscription
 *
 * Paste INSIDE GraphSubscriptionService class
 ******************************************************************************/

/* ==========================================================================
   Create Subscription
========================================================================== */

async createSubscription({

  accessToken,

  resource = "me/mailFolders('Inbox')/messages",

  notificationUrl,

  expirationDateTime,

  clientState = "EnterpriseAI",

  changeType = "created,updated",

}) {

  if (!notificationUrl) {

    throw new Error(
      "Notification URL is required."
    );

  }

  if (!expirationDateTime) {

    throw new Error(
      "Expiration DateTime is required."
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
   Get Subscription
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

      };

    }

  );

}
/******************************************************************************
 * graphSubscriptionService.js
 * Part 3
 * List Subscriptions + Renew Subscription
 *
 * Paste INSIDE GraphSubscriptionService class
 ******************************************************************************/

/* ==========================================================================
   List All Subscriptions
========================================================================== */

async listSubscriptions({

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
      "Expiration DateTime is required."
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

        subscription:
          response.data,

        renewedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphSubscriptionService.js
 * Part 4
 * Delete Subscription + Validate Notification
 *
 * Paste INSIDE GraphSubscriptionService class
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
   Validate Microsoft Graph Notification
========================================================================== */

validateNotification({

  validationToken,

  clientState,

  expectedClientState = "EnterpriseAI",

}) {

  if (validationToken) {

    return {

      success: true,

      type: "Validation",

      validationToken,

    };

  }

  if (

    clientState &&

    clientState !== expectedClientState

  ) {

    return {

      success: false,

      message:
        "Invalid clientState.",

    };

  }

  return {

    success: true,

    message:
      "Notification validated successfully.",

  };

}
/******************************************************************************
 * graphSubscriptionService.js
 * Part 5
 * Health Check + Utilities + Export
 *
 * Paste INSIDE GraphSubscriptionService class
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
      await client.get("/subscriptions");

    return {

      success: true,

      service:
        "Microsoft Graph Subscription Service",

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
      "Subscription Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphSubscriptionService =
  new GraphSubscriptionService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphSubscriptionService initialized."

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
  graphSubscriptionService;

/******************************************************************************
 * End graphSubscriptionService.js
 ******************************************************************************/
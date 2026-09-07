/******************************************************************************
 * graphPresenceService.js
 * Part 1
 * Microsoft Graph Presence Service
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
   Graph Presence Service
========================================================================== */

class GraphPresenceService {

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

          `[Graph Presence Attempt ${attempt}]`,

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
 * graphPresenceService.js
 * Part 2
 * Get My Presence + Get User Presence
 *
 * Paste INSIDE GraphPresenceService class
 ******************************************************************************/

/* ==========================================================================
   Get My Presence
========================================================================== */

async getMyPresence({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/presence"

        );

      return {

        success: true,

        presence:
          response.data,

      };

    }

  );

}

/* ==========================================================================
   Get User Presence
========================================================================== */

async getUserPresence({

  accessToken,

  userId,

}) {

  if (!userId) {

    throw new Error(
      "User Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/users/${userId}/presence`

        );

      return {

        success: true,

        presence:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphPresenceService.js
 * Part 3
 * Set Presence + Set Preferred Presence
 *
 * Paste INSIDE GraphPresenceService class
 ******************************************************************************/

/* ==========================================================================
   Set Presence
========================================================================== */

async setPresence({

  accessToken,

  availability,

  activity,

  expirationDuration = "PT1H",

}) {

  if (!availability) {

    throw new Error(
      "Availability is required."
    );

  }

  if (!activity) {

    throw new Error(
      "Activity is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        sessionId:
          "GraphPresenceService",

        availability,

        activity,

        expirationDuration,

      };

      await client.post(

        "/me/presence/setPresence",

        payload

      );

      return {

        success: true,

        availability,

        activity,

        expiresIn:
          expirationDuration,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Set Preferred Presence
========================================================================== */

async setPreferredPresence({

  accessToken,

  availability,

  activity,

  expirationDuration = "PT8H",

}) {

  if (!availability) {

    throw new Error(
      "Availability is required."
    );

  }

  if (!activity) {

    throw new Error(
      "Activity is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        availability,

        activity,

        expirationDuration,

      };

      await client.post(

        "/me/presence/setUserPreferredPresence",

        payload

      );

      return {

        success: true,

        availability,

        activity,

        expiresIn:
          expirationDuration,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphPresenceService.js
 * Part 4
 * Clear Preferred Presence + Get Presence By User IDs
 *
 * Paste INSIDE GraphPresenceService class
 ******************************************************************************/

/* ==========================================================================
   Clear Preferred Presence
========================================================================== */

async clearPreferredPresence({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.post(

        "/me/presence/clearUserPreferredPresence"

      );

      return {

        success: true,

        message:
          "Preferred presence cleared successfully.",

        clearedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Presence By User IDs (Batch)
========================================================================== */

async getPresenceByUserIds({

  accessToken,

  userIds = [],

}) {

  if (

    !Array.isArray(userIds) ||

    userIds.length === 0

  ) {

    throw new Error(
      "At least one User Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.post(

          "/communications/getPresencesByUserId",

          {

            ids: userIds,

          }

        );

      return {

        success: true,

        total:
          response.data.value.length,

        presences:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphPresenceService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphPresenceService class
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

        "/me/presence"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Presence Service",

      status:
        "Healthy",

      availability:
        response.data.availability,

      activity:
        response.data.activity,

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
      "Presence Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Get My Presence",

      "Get User Presence",

      "Batch Presence Lookup",

      "Set Presence",

      "Set Preferred Presence",

      "Clear Preferred Presence",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphPresenceService =
  new GraphPresenceService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphPresenceService initialized."

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
  graphPresenceService;

/******************************************************************************
 * End graphPresenceService.js
 ******************************************************************************/
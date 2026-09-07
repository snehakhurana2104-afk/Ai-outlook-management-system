/******************************************************************************
 * graphTeamsService.js
 * Part 1
 * Microsoft Graph Teams Service
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
   Graph Teams Service
========================================================================== */

class GraphTeamsService {

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

          `[Graph Teams Attempt ${attempt}]`,

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
 * graphTeamsService.js
 * Part 2
 * Get Teams + Get Team
 ******************************************************************************/

/* ==========================================================================
   Get All Teams
========================================================================== */

async getTeams({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/joinedTeams"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        teams:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Team By Id
========================================================================== */

async getTeam({

  accessToken,

  teamId,

}) {

  if (!teamId) {

    throw new Error(
      "Team Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/teams/${teamId}`

        );

      return {

        success: true,

        team:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphTeamsService.js
 * Part 3
 * Get Channels + Get Channel
 ******************************************************************************/

/* ==========================================================================
   Get All Channels
========================================================================== */

async getChannels({

  accessToken,

  teamId,

}) {

  if (!teamId) {

    throw new Error(
      "Team Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/teams/${teamId}/channels`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        channels:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Channel
========================================================================== */

async getChannel({

  accessToken,

  teamId,

  channelId,

}) {

  if (!teamId) {

    throw new Error(
      "Team Id is required."
    );

  }

  if (!channelId) {

    throw new Error(
      "Channel Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/teams/${teamId}/channels/${channelId}`

        );

      return {

        success: true,

        channel:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphTeamsService.js
 * Part 4
 * Send Channel Message + Get Channel Messages
 ******************************************************************************/

/* ==========================================================================
   Send Channel Message
========================================================================== */

async sendChannelMessage({

  accessToken,

  teamId,

  channelId,

  content,

}) {

  if (!teamId) {

    throw new Error("Team Id is required.");

  }

  if (!channelId) {

    throw new Error("Channel Id is required.");

  }

  if (!content) {

    throw new Error("Message content is required.");

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.post(

          `/teams/${teamId}/channels/${channelId}/messages`,

          {

            body: {

              contentType: "html",

              content,

            },

          }

        );

      return {

        success: true,

        message:
          response.data,

        sentAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Channel Messages
========================================================================== */

async getChannelMessages({

  accessToken,

  teamId,

  channelId,

}) {

  if (!teamId) {

    throw new Error("Team Id is required.");

  }

  if (!channelId) {

    throw new Error("Channel Id is required.");

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/teams/${teamId}/channels/${channelId}/messages`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        messages:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphTeamsService.js
 * Part 5
 * Health Check + Export
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
      await client.get("/me/joinedTeams");

    return {

      success: true,

      service:
        "Microsoft Graph Teams Service",

      status:
        "Healthy",

      totalTeams:
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
   Error Mapping
========================================================================== */

mapGraphError(error) {

  return {

    success: false,

    status:
      error?.response?.status || 500,

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
      "Teams Service",

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
   Singleton
========================================================================== */

const graphTeamsService =
  new GraphTeamsService();

/* ==========================================================================
   Export
========================================================================== */

module.exports =
  graphTeamsService;
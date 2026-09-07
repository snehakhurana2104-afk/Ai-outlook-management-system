/******************************************************************************
 * graphInsightService.js
 * Part 1
 * Microsoft Graph Insights Service
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
   Graph Insight Service
========================================================================== */

class GraphInsightService {

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

          `[Graph Insight Attempt ${attempt}]`,

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
 * graphInsightService.js
 * Part 2
 * Get Trending + Get Used
 *
 * Paste INSIDE GraphInsightService class
 ******************************************************************************/

/* ==========================================================================
   Get Trending Documents
========================================================================== */

async getTrending({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/insights/trending"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        trending:
          response.data.value,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Recently Used Documents
========================================================================== */

async getUsed({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/insights/used"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        used:
          response.data.value,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphInsightService.js
 * Part 3
 * Get Shared + Get Shared With Me
 *
 * Paste INSIDE GraphInsightService class
 ******************************************************************************/

/* ==========================================================================
   Get Shared Documents
========================================================================== */

async getShared({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/insights/shared"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        shared:
          response.data.value,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Files Shared With Me
========================================================================== */

async getSharedWithMe({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/drive/sharedWithMe"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        sharedWithMe:
          response.data.value,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphInsightService.js
 * Part 4
 * Get Trending By User + Insights Summary
 *
 * Paste INSIDE GraphInsightService class
 ******************************************************************************/

/* ==========================================================================
   Get Trending Documents For Specific User
========================================================================== */

async getTrendingByUser({

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

          `/users/${userId}/insights/trending`

        );

      return {

        success: true,

        userId,

        total:
          response.data.value.length,

        trending:
          response.data.value,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Insights Summary
========================================================================== */

async getInsightsSummary({

  accessToken,

}) {

  const [

    trending,

    used,

    shared,

    sharedWithMe,

  ] = await Promise.all([

    this.getTrending({

      accessToken,

    }),

    this.getUsed({

      accessToken,

    }),

    this.getShared({

      accessToken,

    }),

    this.getSharedWithMe({

      accessToken,

    }),

  ]);

  return {

    success: true,

    summary: {

      trending:

        trending.total || 0,

      used:

        used.total || 0,

      shared:

        shared.total || 0,

      sharedWithMe:

        sharedWithMe.total || 0,

    },

    details: {

      trending,

      used,

      shared,

      sharedWithMe,

    },

    generatedAt:
      new Date().toISOString(),

  };

}
/******************************************************************************
 * graphInsightService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphInsightService class
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

        "/me/insights/trending"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Insight Service",

      status:
        "Healthy",

      trendingDocuments:
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
      "Insight Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Trending Documents",

      "Recently Used Documents",

      "Shared Documents",

      "Shared With Me",

      "Trending By User",

      "Insights Summary",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphInsightService =
  new GraphInsightService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphInsightService initialized."

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
  graphInsightService;

/******************************************************************************
 * End graphInsightService.js
 ******************************************************************************/
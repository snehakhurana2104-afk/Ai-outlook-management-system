/******************************************************************************
 * graphSearchService.js
 * Part 1
 * Microsoft Graph Search Service
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
   Graph Search Service
========================================================================== */

class GraphSearchService {

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

          `[Graph Search Attempt ${attempt}]`,

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
 * graphSearchService.js
 * Part 2
 * Search Messages + Search People
 *
 * Paste INSIDE GraphSearchService class
 ******************************************************************************/

/* ==========================================================================
   Search Messages
========================================================================== */

async searchMessages({

  accessToken,

  query,

  from = 0,

  size = 25,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        requests: [

          {

            entityTypes: [

              "message",

            ],

            query: {

              queryString: query,

            },

            from,

            size,

          },

        ],

      };

      const response =
        await client.post(

          "/search/query",

          payload

        );

      const hits =

        response.data.value?.[0]?.hitsContainers?.[0]?.hits ||

        [];

      return {

        success: true,

        query,

        total: hits.length,

        messages: hits,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Search People
========================================================================== */

async searchPeople({

  accessToken,

  query,

  from = 0,

  size = 25,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        requests: [

          {

            entityTypes: [

              "person",

            ],

            query: {

              queryString: query,

            },

            from,

            size,

          },

        ],

      };

      const response =
        await client.post(

          "/search/query",

          payload

        );

      const hits =

        response.data.value?.[0]?.hitsContainers?.[0]?.hits ||

        [];

      return {

        success: true,

        query,

        total: hits.length,

        people: hits,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphSearchService.js
 * Part 3
 * Search Files + Search Sites
 *
 * Paste INSIDE GraphSearchService class
 ******************************************************************************/

/* ==========================================================================
   Search Files
========================================================================== */

async searchFiles({

  accessToken,

  query,

  from = 0,

  size = 25,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        requests: [

          {

            entityTypes: [

              "driveItem",

            ],

            query: {

              queryString: query,

            },

            from,

            size,

          },

        ],

      };

      const response =
        await client.post(

          "/search/query",

          payload

        );

      const hits =

        response.data.value?.[0]?.hitsContainers?.[0]?.hits ||

        [];

      return {

        success: true,

        query,

        total: hits.length,

        files: hits,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Search SharePoint Sites
========================================================================== */

async searchSites({

  accessToken,

  query,

  from = 0,

  size = 25,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        requests: [

          {

            entityTypes: [

              "site",

            ],

            query: {

              queryString: query,

            },

            from,

            size,

          },

        ],

      };

      const response =
        await client.post(

          "/search/query",

          payload

        );

      const hits =

        response.data.value?.[0]?.hitsContainers?.[0]?.hits ||

        [];

      return {

        success: true,

        query,

        total: hits.length,

        sites: hits,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphSearchService.js
 * Part 4
 * Search Events + Search Chats
 *
 * Paste INSIDE GraphSearchService class
 ******************************************************************************/

/* ==========================================================================
   Search Calendar Events
========================================================================== */

async searchEvents({

  accessToken,

  query,

  from = 0,

  size = 25,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        requests: [

          {

            entityTypes: [

              "event",

            ],

            query: {

              queryString: query,

            },

            from,

            size,

          },

        ],

      };

      const response =
        await client.post(

          "/search/query",

          payload

        );

      const hits =

        response.data.value?.[0]?.hitsContainers?.[0]?.hits ||

        [];

      return {

        success: true,

        query,

        total:
          hits.length,

        events:
          hits,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Search Teams Chats
========================================================================== */

async searchChats({

  accessToken,

  query,

  from = 0,

  size = 25,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        requests: [

          {

            entityTypes: [

              "chatMessage",

            ],

            query: {

              queryString: query,

            },

            from,

            size,

          },

        ],

      };

      const response =
        await client.post(

          "/search/query",

          payload

        );

      const hits =

        response.data.value?.[0]?.hitsContainers?.[0]?.hits ||

        [];

      return {

        success: true,

        query,

        total:
          hits.length,

        chats:
          hits,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphSearchService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphSearchService class
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

        "/me"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Search Service",

      status:
        "Healthy",

      user:

        response.data.userPrincipalName ||

        response.data.mail ||

        response.data.displayName,

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
      "Search Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Search Messages",

      "Search People",

      "Search Files",

      "Search Sites",

      "Search Events",

      "Search Chats",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphSearchService =
  new GraphSearchService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphSearchService initialized."

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
  graphSearchService;

/******************************************************************************
 * End graphSearchService.js
 ******************************************************************************/
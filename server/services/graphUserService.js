/******************************************************************************
 * graphUserService.js
 * Part 1
 * Microsoft Graph User Service
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
   Graph User Service
========================================================================== */

class GraphUserService {

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

          `[Graph User Attempt ${attempt}]`,

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
 * graphUserService.js
 * Part 2
 * Get Profile + Get Manager
 *
 * Paste INSIDE GraphUserService class
 ******************************************************************************/

/* ==========================================================================
   Get Current User Profile
========================================================================== */

async getProfile({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me"

        );

      return {

        success: true,

        user:
          response.data,

      };

    }

  );

}

/* ==========================================================================
   Get User Manager
========================================================================== */

async getManager({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/manager"

        );

      return {

        success: true,

        manager:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphUserService.js
 * Part 3
 * Get Photo + Get Direct Reports
 *
 * Paste INSIDE GraphUserService class
 ******************************************************************************/

/* ==========================================================================
   Get User Photo
========================================================================== */

async getPhoto({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/photo/$value",

          {

            responseType: "arraybuffer",

          }

        );

      return {

        success: true,

        contentType:

          response.headers["content-type"],

        photo:

          Buffer.from(response.data),

      };

    }

  );

}

/* ==========================================================================
   Get Direct Reports
========================================================================== */

async getDirectReports({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/directReports"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        reports:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphUserService.js
 * Part 4
 * Update Profile + Get Organization
 *
 * Paste INSIDE GraphUserService class
 ******************************************************************************/

/* ==========================================================================
   Update User Profile
========================================================================== */

async updateProfile({

  accessToken,

  updates = {},

}) {

  if (

    !updates ||

    Object.keys(updates).length === 0

  ) {

    throw new Error(
      "Profile updates are required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          "/me",

          updates

        );

      return {

        success: true,

        profile:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Organization
========================================================================== */

async getOrganization({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/organization"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        organization:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphUserService.js
 * Part 5
 * Health Check + Utilities + Export
 *
 * Paste INSIDE GraphUserService class
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
      await client.get("/me");

    return {

      success: true,

      service:
        "Microsoft Graph User Service",

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
      "User Service",

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

const graphUserService =
  new GraphUserService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphUserService initialized."

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
  graphUserService;

/******************************************************************************
 * End graphUserService.js
 ******************************************************************************/
/******************************************************************************
 * graphDriveService.js
 * Part 1
 * Microsoft Graph Drive Service
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
   Graph Drive Service
========================================================================== */

class GraphDriveService {

  constructor() {

    this.baseURL = GRAPH_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT;
    this.maxRetries = MAX_RETRIES;

  }

  sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

  }

  createClient(accessToken) {

    if (!accessToken) {

      throw new Error("Microsoft Graph access token is required.");

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

        if (attempt < this.maxRetries) {

          await this.sleep(attempt * 1000);

        }

      }

    }

    throw lastError;

  }
  /******************************************************************************
 * graphDriveService.js
 * Part 2
 * Get Drive + Root Items
 ******************************************************************************/

/* ==========================================================================
   Get User Drive
========================================================================== */

async getDrive({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get("/me/drive");

      return {

        success: true,

        drive: response.data,

      };

    }

  );

}

/* ==========================================================================
   Get Root Folder Items
========================================================================== */

async getRootItems({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/drive/root/children"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        items:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphDriveService.js
 * Part 3
 * Get Item + Search
 ******************************************************************************/

/* ==========================================================================
   Get Drive Item
========================================================================== */

async getItem({

  accessToken,

  itemId,

}) {

  if (!itemId) {

    throw new Error(
      "Item Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/drive/items/${itemId}`

        );

      return {

        success: true,

        item:
          response.data,

      };

    }

  );

}

/* ==========================================================================
   Search Drive Items
========================================================================== */

async searchItems({

  accessToken,

  query,

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

      const response =
        await client.get(

          `/me/drive/root/search(q='${encodeURIComponent(query)}')`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        items:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphDriveService.js
 * Part 4
 * Upload + Download File
 ******************************************************************************/

/* ==========================================================================
   Upload File
========================================================================== */

async uploadFile({

  accessToken,

  fileName,

  fileBuffer,

}) {

  if (!fileName) {

    throw new Error(
      "File name is required."
    );

  }

  if (!fileBuffer) {

    throw new Error(
      "File buffer is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.put(

          `/me/drive/root:/${fileName}:/content`,

          fileBuffer,

          {

            headers: {

              "Content-Type":
                "application/octet-stream",

            },

          }

        );

      return {

        success: true,

        file:
          response.data,

        uploadedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Download File
========================================================================== */

async downloadFile({

  accessToken,

  itemId,

}) {

  if (!itemId) {

    throw new Error(
      "Item Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/drive/items/${itemId}/content`,

          {

            responseType: "arraybuffer",

          }

        );

      return {

        success: true,

        file:
          Buffer.from(response.data),

      };

    }

  );

}
/******************************************************************************
 * graphDriveService.js
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
      await client.get(

        "/me/drive"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Drive Service",

      status:
        "Healthy",

      drive:

        response.data.name,

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
      "Drive Service",

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

const graphDriveService =
  new GraphDriveService();

/* ==========================================================================
   Export
========================================================================== */

module.exports =
  graphDriveService;

/******************************************************************************
 * End graphDriveService.js
 ******************************************************************************/
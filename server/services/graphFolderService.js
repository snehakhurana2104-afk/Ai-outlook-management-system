/******************************************************************************
 * graphFolderService.js
 * Part 1
 * Microsoft Graph Folder Service
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
   Graph Folder Service
========================================================================== */

class GraphFolderService {

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

          `[Graph Folder Attempt ${attempt}]`,

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
 * graphFolderService.js
 * Part 2
 * Get Folders + Get Folder
 ******************************************************************************/

/* ==========================================================================
   Get Mail Folders
========================================================================== */

async getFolders({

  accessToken,

  top = 100,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/mailFolders?$top=${top}`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        folders:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Single Folder
========================================================================== */

async getFolder({

  accessToken,

  folderId,

}) {

  if (!folderId) {

    throw new Error(
      "Folder Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/mailFolders/${folderId}`

        );

      return {

        success: true,

        folder:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphFolderService.js
 * Part 3
 * Create Folder + Rename Folder
 ******************************************************************************/

/* ==========================================================================
   Create Mail Folder
========================================================================== */

async createFolder({

  accessToken,

  displayName,

  parentFolderId = null,

}) {

  if (!displayName) {

    throw new Error(
      "Folder name is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        displayName,

      };

      const endpoint = parentFolderId

        ? `/me/mailFolders/${parentFolderId}/childFolders`

        : "/me/mailFolders";

      const response =
        await client.post(

          endpoint,

          payload

        );

      return {

        success: true,

        folderId:
          response.data.id,

        folder:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Rename Mail Folder
========================================================================== */

async renameFolder({

  accessToken,

  folderId,

  displayName,

}) {

  if (!folderId) {

    throw new Error(
      "Folder Id is required."
    );

  }

  if (!displayName) {

    throw new Error(
      "New folder name is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          `/me/mailFolders/${folderId}`,

          {

            displayName,

          }

        );

      return {

        success: true,

        folderId,

        folder:
          response.data,

        renamedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphFolderService.js
 * Part 4
 * Delete Folder + Move Message + Folder Statistics
 ******************************************************************************/

/* ==========================================================================
   Delete Folder
========================================================================== */

async deleteFolder({

  accessToken,

  folderId,

}) {

  if (!folderId) {

    throw new Error(
      "Folder Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/mailFolders/${folderId}`

      );

      return {

        success: true,

        folderId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Move Message To Folder
========================================================================== */

async moveMessageToFolder({

  accessToken,

  messageId,

  destinationFolderId,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!destinationFolderId) {

    throw new Error(
      "Destination Folder Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.post(

          `/me/messages/${messageId}/move`,

          {

            destinationId:
              destinationFolderId,

          }

        );

      return {

        success: true,

        messageId,

        folderId:
          destinationFolderId,

        message:
          response.data,

        movedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Folder Statistics
========================================================================== */

async getFolderStatistics({

  accessToken,

  folderId,

}) {

  if (!folderId) {

    throw new Error(
      "Folder Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/mailFolders/${folderId}`

        );

      return {

        success: true,

        folderId,

        displayName:
          response.data.displayName,

        totalItems:
          response.data.totalItemCount,

        unreadItems:
          response.data.unreadItemCount,

        childFolderCount:
          response.data.childFolderCount,

      };

    }

  );

}
/******************************************************************************
 * graphFolderService.js
 * Part 5
 * Health Check + Utilities + Export
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
        "Microsoft Graph Folder Service",

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
   Enterprise Graph Error Mapping
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
      "Folder Service",

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

const graphFolderService =
  new GraphFolderService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphFolderService initialized."

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
  graphFolderService;

/******************************************************************************
 * End graphFolderService.js
 ******************************************************************************/
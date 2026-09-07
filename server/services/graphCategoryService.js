/******************************************************************************
 * graphCategoryService.js
 * Part 1
 * Microsoft Graph Category Service
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
   Graph Category Service
========================================================================== */

class GraphCategoryService {

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

          `[Graph Category Attempt ${attempt}]`,

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
 * graphCategoryService.js
 * Part 2
 * Get Categories + Get Category
 *
 * Paste INSIDE GraphCategoryService class
 ******************************************************************************/

/* ==========================================================================
   Get All Outlook Categories
========================================================================== */

async getCategories({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/outlook/masterCategories"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        categories:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Category By Id (Display Name)
========================================================================== */

async getCategory({

  accessToken,

  categoryId,

}) {

  if (!categoryId) {

    throw new Error(
      "Category Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/outlook/masterCategories/${categoryId}`

        );

      return {

        success: true,

        category:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphCategoryService.js
 * Part 3
 * Create Category + Update Category
 *
 * Paste INSIDE GraphCategoryService class
 ******************************************************************************/

/* ==========================================================================
   Create Category
========================================================================== */

async createCategory({

  accessToken,

  displayName,

  color,

}) {

  if (!displayName) {

    throw new Error(
      "Category name is required."
    );

  }

  if (!color) {

    throw new Error(
      "Category color is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        displayName,

        color,

      };

      const response =
        await client.post(

          "/me/outlook/masterCategories",

          payload

        );

      return {

        success: true,

        category:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Update Category
========================================================================== */

async updateCategory({

  accessToken,

  categoryId,

  displayName,

  color,

}) {

  if (!categoryId) {

    throw new Error(
      "Category Id is required."
    );

  }

  const payload = {};

  if (displayName !== undefined) {

    payload.displayName =
      displayName;

  }

  if (color !== undefined) {

    payload.color =
      color;

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          `/me/outlook/masterCategories/${categoryId}`,

          payload

        );

      return {

        success: true,

        categoryId,

        category:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphCategoryService.js
 * Part 4
 * Delete Category + Assign Category To Message
 *
 * Paste INSIDE GraphCategoryService class
 ******************************************************************************/

/* ==========================================================================
   Delete Category
========================================================================== */

async deleteCategory({

  accessToken,

  categoryId,

}) {

  if (!categoryId) {

    throw new Error(
      "Category Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/outlook/masterCategories/${categoryId}`

      );

      return {

        success: true,

        categoryId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Assign Category To Message
========================================================================== */

async assignCategoryToMessage({

  accessToken,

  messageId,

  categories = [],

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (

    !Array.isArray(categories)

  ) {

    throw new Error(
      "Categories must be an array."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          `/me/messages/${messageId}`,

          {

            categories,

          }

        );

      return {

        success: true,

        messageId,

        categories,

        message:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphCategoryService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphCategoryService class
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

        "/me/outlook/masterCategories"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Category Service",

      status:
        "Healthy",

      totalCategories:
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
      "Category Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Get Categories",

      "Get Category",

      "Create Category",

      "Update Category",

      "Delete Category",

      "Assign Category To Message",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphCategoryService =
  new GraphCategoryService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphCategoryService initialized."

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
  graphCategoryService;

/******************************************************************************
 * End graphCategoryService.js
 ******************************************************************************/
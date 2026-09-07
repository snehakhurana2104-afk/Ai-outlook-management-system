/******************************************************************************
 * graphDraftService.js
 * Part 1
 * Microsoft Graph Draft Mail Service
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
   Graph Draft Service
========================================================================== */

class GraphDraftService {

  constructor() {

    this.baseURL = GRAPH_BASE_URL;

    this.timeout = DEFAULT_TIMEOUT;

    this.maxRetries = MAX_RETRIES;

  }

  /* ========================================================================
     Delay Helper
  ======================================================================== */

  sleep(ms) {

    return new Promise((resolve) => {

      setTimeout(resolve, ms);

    });

  }

  /* ========================================================================
     Axios Client
  ======================================================================== */

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

  /* ========================================================================
     Retry Wrapper
  ======================================================================== */

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

          `[Graph Draft Attempt ${attempt}]`,

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
 * graphDraftService.js
 * Part 2
 * Create Draft + Get Draft
 ******************************************************************************/

/* ==========================================================================
   Create Draft
========================================================================== */

async createDraft({

  accessToken,

  subject = "",

  body = "",

  toRecipients = [],

  ccRecipients = [],

  bccRecipients = [],

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        subject,

        body: {

          contentType: "HTML",

          content: body,

        },

        toRecipients:

          toRecipients.map((email) => ({

            emailAddress: {

              address: email,

            },

          })),

        ccRecipients:

          ccRecipients.map((email) => ({

            emailAddress: {

              address: email,

            },

          })),

        bccRecipients:

          bccRecipients.map((email) => ({

            emailAddress: {

              address: email,

            },

          })),

      };

      const response =
        await client.post(

          "/me/messages",

          payload

        );

      return {

        success: true,

        draftId:
          response.data.id,

        draft:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Draft
========================================================================== */

async getDraft({

  accessToken,

  draftId,

}) {

  if (!draftId) {

    throw new Error(
      "Draft Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/messages/${draftId}`

        );

      return {

        success: true,

        draft:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphDraftService.js
 * Part 3
 * Update Draft + Delete Draft
 ******************************************************************************/

/* ==========================================================================
   Update Draft
========================================================================== */

async updateDraft({

  accessToken,

  draftId,

  subject,

  body,

  toRecipients,

  ccRecipients = [],

  bccRecipients = [],

}) {

  if (!draftId) {

    throw new Error(
      "Draft Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {};

      if (subject !== undefined) {

        payload.subject = subject;

      }

      if (body !== undefined) {

        payload.body = {

          contentType: "HTML",

          content: body,

        };

      }

      if (Array.isArray(toRecipients)) {

        payload.toRecipients =
          toRecipients.map((email) => ({

            emailAddress: {

              address: email,

            },

          }));

      }

      if (Array.isArray(ccRecipients)) {

        payload.ccRecipients =
          ccRecipients.map((email) => ({

            emailAddress: {

              address: email,

            },

          }));

      }

      if (Array.isArray(bccRecipients)) {

        payload.bccRecipients =
          bccRecipients.map((email) => ({

            emailAddress: {

              address: email,

            },

          }));

      }

      const response =
        await client.patch(

          `/me/messages/${draftId}`,

          payload

        );

      return {

        success: true,

        draftId,

        draft:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Delete Draft
========================================================================== */

async deleteDraft({

  accessToken,

  draftId,

}) {

  if (!draftId) {

    throw new Error(
      "Draft Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/messages/${draftId}`

      );

      return {

        success: true,

        draftId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphDraftService.js
 * Part 4
 * List Drafts + Save AI Reply As Draft + Helpers
 ******************************************************************************/

/* ==========================================================================
   Format Recipients
========================================================================== */

formatRecipients(recipients = []) {

  if (!Array.isArray(recipients)) {

    return [];

  }

  return recipients

    .filter(Boolean)

    .map((recipient) => ({

      emailAddress: {

        address:

          typeof recipient === "string"

            ? recipient

            : recipient.email ||

              recipient.address ||

              "",

        name:

          recipient.name || "",

      },

    }));

}

/* ==========================================================================
   List Drafts
========================================================================== */

async listDrafts({

  accessToken,

  top = 50,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/mailFolders/drafts/messages?$top=${top}`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        drafts:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Save AI Reply As Draft
========================================================================== */

async saveAIReplyAsDraft({

  accessToken,

  subject,

  reply,

  toRecipients = [],

  ccRecipients = [],

  bccRecipients = [],

}) {

  return await this.createDraft({

    accessToken,

    subject,

    body: reply,

    toRecipients,

    ccRecipients,

    bccRecipients,

  });

}

/* ==========================================================================
   Search Drafts
========================================================================== */

async searchDrafts({

  accessToken,

  keyword,

}) {

  if (!keyword) {

    throw new Error(
      "Search keyword is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/mailFolders/drafts/messages?$search="${keyword}"`

        );

      return {

        success: true,

        keyword,

        total:
          response.data.value.length,

        drafts:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphDraftService.js
 * Part 5
 * Utilities + Export
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

      service: "Microsoft Graph Draft Service",

      status: "Healthy",

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
   Graph Error Mapping
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

    provider: "Microsoft Graph",

    service: "Draft Mail Service",

    version: "v1.0",

    endpoint: this.baseURL,

    timeout: this.timeout,

    retries: this.maxRetries,

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphDraftService =
  new GraphDraftService();

/* ==========================================================================
   Initialize
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphDraftService initialized."

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
  graphDraftService;


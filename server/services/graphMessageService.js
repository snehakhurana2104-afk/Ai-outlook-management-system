/******************************************************************************
 * graphMessageService.js
 * Part 1
 * Microsoft Graph Message Service
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
   Graph Message Service
========================================================================== */

class GraphMessageService {

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

          `[Graph Message Attempt ${attempt}]`,

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
 * graphMessageService.js
 * Part 2
 * Get Messages + Get Message
 *
 * Paste INSIDE GraphMessageService class
 ******************************************************************************/

/* ==========================================================================
   Get Messages
========================================================================== */

async getMessages({

  accessToken,

  top = 50,

  skip = 0,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc`

        );

      return {

        success: true,

        count:
          response.data.value.length,

        messages:
          response.data.value,

        nextLink:
          response.data["@odata.nextLink"] ||

          null,

      };

    }

  );

}

/* ==========================================================================
   Get Single Message
========================================================================== */

async getMessage({

  accessToken,

  messageId,

}) {

  if (!messageId) {

    throw new Error(

      "Message Id is required."

    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/messages/${messageId}`

        );

      return {

        success: true,

        message:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphMessageService.js
 * Part 3
 * Send Message + Create Draft Message
 *
 * Paste INSIDE GraphMessageService class
 ******************************************************************************/

/* ==========================================================================
   Send Message
========================================================================== */

async sendMessage({

  accessToken,

  subject,

  body,

  toRecipients = [],

  ccRecipients = [],

  bccRecipients = [],

}) {

  if (!subject) {

    throw new Error(
      "Subject is required."
    );

  }

  if (!body) {

    throw new Error(
      "Message body is required."
    );

  }

  if (toRecipients.length === 0) {

    throw new Error(
      "At least one recipient is required."
    );

  }

  const client =
    this.createClient(accessToken);

  const formatRecipients = (list = []) =>
    list.map((email) => ({

      emailAddress: {

        address: email,

      },

    }));

  return await this.execute(

    async () => {

      const response =
        await client.post(

          "/me/sendMail",

          {

            message: {

              subject,

              body: {

                contentType: "HTML",

                content: body,

              },

              toRecipients:
                formatRecipients(toRecipients),

              ccRecipients:
                formatRecipients(ccRecipients),

              bccRecipients:
                formatRecipients(bccRecipients),

            },

            saveToSentItems: true,

          }

        );

      return {

        success: true,

        status:
          response.status,

        sentAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Create Draft Message
========================================================================== */

async createDraftMessage({

  accessToken,

  subject,

  body = "",

  toRecipients = [],

  ccRecipients = [],

  bccRecipients = [],

}) {

  if (!subject) {

    throw new Error(
      "Subject is required."
    );

  }

  const client =
    this.createClient(accessToken);

  const formatRecipients = (list = []) =>
    list.map((email) => ({

      emailAddress: {

        address: email,

      },

    }));

  return await this.execute(

    async () => {

      const response =
        await client.post(

          "/me/messages",

          {

            subject,

            body: {

              contentType: "HTML",

              content: body,

            },

            toRecipients:
              formatRecipients(toRecipients),

            ccRecipients:
              formatRecipients(ccRecipients),

            bccRecipients:
              formatRecipients(bccRecipients),

          }

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
/******************************************************************************
 * graphMessageService.js
 * Part 4
 * Update + Delete + Move + Copy Message
 *
 * Paste INSIDE GraphMessageService class
 ******************************************************************************/

/* ==========================================================================
   Update Message
========================================================================== */

async updateMessage({

  accessToken,

  messageId,

  subject,

  body,

  isRead,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
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

      if (isRead !== undefined) {

        payload.isRead = isRead;

      }

      const response =
        await client.patch(

          `/me/messages/${messageId}`,

          payload

        );

      return {

        success: true,

        messageId,

        message: response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Delete Message
========================================================================== */

async deleteMessage({

  accessToken,

  messageId,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/messages/${messageId}`

      );

      return {

        success: true,

        messageId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Move Message
========================================================================== */

async moveMessage({

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
   Copy Message
========================================================================== */

async copyMessage({

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

          `/me/messages/${messageId}/copy`,

          {

            destinationId:
              destinationFolderId,

          }

        );

      return {

        success: true,

        folderId:
          destinationFolderId,

        message:
          response.data,

        copiedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphMessageService.js
 * Part 5
 * Read/Unread + Health Check + Export
 *
 * Paste INSIDE GraphMessageService class
 ******************************************************************************/

/* ==========================================================================
   Mark Message As Read
========================================================================== */

async markAsRead({

  accessToken,

  messageId,

}) {

  return await this.updateMessage({

    accessToken,

    messageId,

    isRead: true,

  });

}

/* ==========================================================================
   Mark Message As Unread
========================================================================== */

async markAsUnread({

  accessToken,

  messageId,

}) {

  return await this.updateMessage({

    accessToken,

    messageId,

    isRead: false,

  });

}

/* ==========================================================================
   Enterprise Error Mapper
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
        "Microsoft Graph Message Service",

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
   Service Information
========================================================================== */

getServiceInfo() {

  return {

    provider:
      "Microsoft Graph",

    service:
      "Message Service",

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

const graphMessageService =
  new GraphMessageService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphMessageService initialized."

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
  graphMessageService;

/******************************************************************************
 * End graphMessageService.js
 ******************************************************************************/
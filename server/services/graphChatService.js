/******************************************************************************
 * graphChatService.js
 * Part 1
 * Microsoft Graph Chat Service
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
   Graph Chat Service
========================================================================== */

class GraphChatService {

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

          `[Graph Chat Attempt ${attempt}]`,

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
 * graphChatService.js
 * Part 2
 * Get Chats + Get Chat
 *
 * Paste INSIDE GraphChatService class
 ******************************************************************************/

/* ==========================================================================
   Get User Chats
========================================================================== */

async getChats({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/chats"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        chats:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Chat By Id
========================================================================== */

async getChat({

  accessToken,

  chatId,

}) {

  if (!chatId) {

    throw new Error(
      "Chat Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/chats/${chatId}`

        );

      return {

        success: true,

        chat:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphChatService.js
 * Part 3
 * Get Messages + Get Message
 *
 * Paste INSIDE GraphChatService class
 ******************************************************************************/

/* ==========================================================================
   Get Chat Messages
========================================================================== */

async getMessages({

  accessToken,

  chatId,

}) {

  if (!chatId) {

    throw new Error(
      "Chat Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/chats/${chatId}/messages`

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

/* ==========================================================================
   Get Single Message
========================================================================== */

async getMessage({

  accessToken,

  chatId,

  messageId,

}) {

  if (!chatId) {

    throw new Error(
      "Chat Id is required."
    );

  }

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

          `/chats/${chatId}/messages/${messageId}`

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
 * graphChatService.js
 * Part 4
 * Send Message + Update Message
 *
 * Paste INSIDE GraphChatService class
 ******************************************************************************/

/* ==========================================================================
   Send Chat Message
========================================================================== */

async sendMessage({

  accessToken,

  chatId,

  content,

  contentType = "html",

}) {

  if (!chatId) {

    throw new Error(
      "Chat Id is required."
    );

  }

  if (!content) {

    throw new Error(
      "Message content is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        body: {

          contentType,

          content,

        },

      };

      const response =
        await client.post(

          `/chats/${chatId}/messages`,

          payload

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
   Update Chat Message
========================================================================== */

async updateMessage({

  accessToken,

  chatId,

  messageId,

  content,

  contentType = "html",

}) {

  if (!chatId) {

    throw new Error(
      "Chat Id is required."
    );

  }

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!content) {

    throw new Error(
      "Updated content is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        body: {

          contentType,

          content,

        },

      };

      const response =
        await client.patch(

          `/chats/${chatId}/messages/${messageId}`,

          payload

        );

      return {

        success: true,

        messageId,

        message:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphChatService.js
 * Part 5
 * Delete Message + Health Check + Export
 *
 * Paste INSIDE GraphChatService class
 ******************************************************************************/

/* ==========================================================================
   Delete Message
========================================================================== */

async deleteMessage({

  accessToken,

  chatId,

  messageId,

}) {

  if (!chatId) {

    throw new Error(
      "Chat Id is required."
    );

  }

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

        `/chats/${chatId}/messages/${messageId}`

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

        "/me/chats"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Chat Service",

      status:
        "Healthy",

      totalChats:
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
      "Chat Service",

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

const graphChatService =
  new GraphChatService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphChatService initialized."

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
  graphChatService;

/******************************************************************************
 * End graphChatService.js
 ******************************************************************************/
/******************************************************************************
 * graphSendMail.js
 * Part 1
 * Enterprise Microsoft Graph Mail Service
 ******************************************************************************/

const axios = require("axios");

/* ==========================================================================
   Configuration
========================================================================== */

const GRAPH_BASE_URL =
  process.env.GRAPH_BASE_URL ||
  "https://graph.microsoft.com/v1.0";

const DEFAULT_TIMEOUT =
  Number(process.env.GRAPH_TIMEOUT || 30000);

const MAX_RETRIES =
  Number(process.env.GRAPH_MAX_RETRIES || 3);

/* ==========================================================================
   Graph Send Mail Service
========================================================================== */

class GraphSendMailService {

  constructor() {

    this.baseURL = GRAPH_BASE_URL;

    this.timeout = DEFAULT_TIMEOUT;

    this.maxRetries = MAX_RETRIES;

  }

  /* ==========================================================
     Delay Helper
  ========================================================== */

  sleep(ms) {

    return new Promise((resolve) => {

      setTimeout(resolve, ms);

    });

  }

  /* ==========================================================
     Create Axios Client
  ========================================================== */

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

        Accept: "application/json",

      },

    });

  }

  /* ==========================================================
     Retry Wrapper
  ========================================================== */

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

          `[Graph Attempt ${attempt}]`,

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
     /**************************************************************************
   * Send Reply
   **************************************************************************/

  async sendReply({

    accessToken,

    messageId,

    body,

    subject = "",

    recipients = [],

  }) {

    if (!messageId) {

      throw new Error(
        "Message Id is required."
      );

    }

    if (!body) {

      throw new Error(
        "Reply body is required."
      );

    }

    const client =
      this.createClient(accessToken);

    return await this.execute(

      async () => {

        const payload = {

          message: {

            subject,

            body: {

              contentType: "HTML",

              content: body,

            },

            ...(recipients.length > 0
              ? {

                  toRecipients:
                    recipients.map((email) => ({

                      emailAddress: {

                        address: email,

                      },

                    })),

                }
              : {}),

          },

          saveToSentItems: true,

        };

        await client.post(

          `/me/messages/${messageId}/reply`,

          payload

        );

        return {

          success: true,

          messageId,

          operation: "reply",

          sentAt:
            new Date().toISOString(),

        };

      }

    );

  }

  /**************************************************************************
   * Reply All
   **************************************************************************/

  async replyAll({

    accessToken,

    messageId,

    body,

  }) {

    if (!messageId) {

      throw new Error(
        "Message Id is required."
      );

    }

    if (!body) {

      throw new Error(
        "Reply body is required."
      );

    }

    const client =
      this.createClient(accessToken);

    return await this.execute(

      async () => {

        await client.post(

          `/me/messages/${messageId}/replyAll`,

          {

            comment: body,

          }

        );

        return {

          success: true,

          messageId,

          operation: "replyAll",

          sentAt:
            new Date().toISOString(),

        };

      }

    );

  }
  /******************************************************************************
 * graphSendMail.js
 * Part 3
 * Recipient Formatting + Send Mail + Forward Mail
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
   Send New Mail
========================================================================== */

async sendNewMail({

  accessToken,

  subject,

  body,

  toRecipients = [],

  ccRecipients = [],

  bccRecipients = [],

  saveToSentItems = true,

}) {

  if (!subject) {

    throw new Error(
      "Subject is required."
    );

  }

  if (!body) {

    throw new Error(
      "Email body is required."
    );

  }

  if (toRecipients.length === 0) {

    throw new Error(
      "At least one recipient is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        message: {

          subject,

          body: {

            contentType: "HTML",

            content: body,

          },

          toRecipients:

            this.formatRecipients(

              toRecipients

            ),

          ccRecipients:

            this.formatRecipients(

              ccRecipients

            ),

          bccRecipients:

            this.formatRecipients(

              bccRecipients

            ),

        },

        saveToSentItems,

      };

      await client.post(

        "/me/sendMail",

        payload

      );

      return {

        success: true,

        operation: "sendMail",

        subject,

        sentAt:

          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Forward Mail
========================================================================== */

async forwardMail({

  accessToken,

  messageId,

  comment = "",

  toRecipients = [],

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (toRecipients.length === 0) {

    throw new Error(
      "Forward recipients are required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.post(

        `/me/messages/${messageId}/forward`,

        {

          comment,

          toRecipients:

            this.formatRecipients(

              toRecipients

            ),

        }

      );

      return {

        success: true,

        operation: "forward",

        messageId,

        forwardedAt:

          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphSendMail.js
 * Part 4
 * Get Message + User Profile + Verify Token + Health Check
 *
 * Paste INSIDE class GraphSendMailService
 ******************************************************************************/

/* ==========================================================================
   Get Message
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

      return response.data;

    }

  );

}

/* ==========================================================================
   Get User Profile
========================================================================== */

async getUserProfile({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get("/me");

      return response.data;

    }

  );

}

/* ==========================================================================
   Verify Access Token
========================================================================== */

async verifyAccessToken(accessToken) {

  try {

    const profile =
      await this.getUserProfile({

        accessToken,

      });

    return {

      valid: true,

      profile,

    };

  }

  catch (error) {

    return {

      valid: false,

      error:

        error.message ||

        "Invalid Microsoft Graph Token",

    };

  }

}

/* ==========================================================================
   Enterprise Health Check
========================================================================== */

async healthCheck({

  accessToken,

}) {

  try {

    const profile =
      await this.getUserProfile({

        accessToken,

      });

    return {

      success: true,

      service:
        "Microsoft Graph",

      status:
        "Healthy",

      user:

        profile.displayName ||

        profile.userPrincipalName ||

        profile.mail,

      checkedAt:
        new Date().toISOString(),

    };

  }

  catch (error) {

    return this.mapGraphError(error);

  }

}

/* ==========================================================================
   Error Mapper
========================================================================== */

mapGraphError(error) {

  const status =

    error?.response?.status ||

    500;

  const graphError =

    error?.response?.data?.error ||

    {};

  return {

    success: false,

    status,

    code:

      graphError.code ||

      "GRAPH_ERROR",

    message:

      graphError.message ||

      error.message ||

      "Microsoft Graph Error",

    retryable:

      status >= 500 ||

      status === 429,

  };

}

/* ==========================================================================
   Service Information
========================================================================== */

getServiceInfo() {

  return {

    provider:
      "Microsoft Graph",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    initialized:
      true,

  };

}
/******************************************************************************
 * graphSendMail.js
 * Part 5
 * Finalization
 ******************************************************************************/

/* ==========================================================================
   Close Class
========================================================================== */

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphSendMailService =
  new GraphSendMailService();

/* ==========================================================================
   Initialize Service
========================================================================== */

try {

  console.info(
    "[Microsoft Graph] GraphSendMailService initialized successfully."
  );

}
catch (error) {

  console.error(
    "[Microsoft Graph] Initialization failed:",
    error.message
  );

}

/* ==========================================================================
   Export Singleton
========================================================================== */

module.exports = graphSendMailService;

/******************************************************************************
 * End graphSendMail.js
 ******************************************************************************/
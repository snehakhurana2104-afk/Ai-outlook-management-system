/******************************************************************************
 * graphAttachmentService.js
 * Part 1
 * Microsoft Graph Attachment Service
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
   Graph Attachment Service
========================================================================== */

class GraphAttachmentService {

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

          `[Graph Attachment Attempt ${attempt}]`,

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
 * graphAttachmentService.js
 * Part 2
 * Upload Attachment + Upload Multiple Attachments
 ******************************************************************************/

/* ==========================================================================
   Upload Attachment
========================================================================== */

async uploadAttachment({

  accessToken,

  messageId,

  fileName,

  contentType,

  contentBytes,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!fileName) {

    throw new Error(
      "File name is required."
    );

  }

  if (!contentBytes) {

    throw new Error(
      "Attachment content is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        "@odata.type": "#microsoft.graph.fileAttachment",

        name: fileName,

        contentType:

          contentType ||

          "application/octet-stream",

        contentBytes,

      };

      const response =
        await client.post(

          `/me/messages/${messageId}/attachments`,

          payload

        );

      return {

        success: true,

        attachmentId:

          response.data.id,

        attachment:

          response.data,

        uploadedAt:

          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Upload Multiple Attachments
========================================================================== */

async uploadMultipleAttachments({

  accessToken,

  messageId,

  attachments = [],

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!Array.isArray(attachments)) {

    throw new Error(
      "Attachments must be an array."
    );

  }

  const results = [];

  for (const attachment of attachments) {

    const result =
      await this.uploadAttachment({

        accessToken,

        messageId,

        fileName:

          attachment.fileName ||

          attachment.name,

        contentType:

          attachment.contentType,

        contentBytes:

          attachment.contentBytes,

      });

    results.push(result);

  }

  return {

    success: true,

    total:

      results.length,

    attachments:

      results,

  };

}
/******************************************************************************
 * graphAttachmentService.js
 * Part 3
 * List Attachments + Get Attachment
 ******************************************************************************/

/* ==========================================================================
   List Attachments
========================================================================== */

async listAttachments({

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

          `/me/messages/${messageId}/attachments`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        attachments:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Attachment
========================================================================== */

async getAttachment({

  accessToken,

  messageId,

  attachmentId,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!attachmentId) {

    throw new Error(
      "Attachment Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/messages/${messageId}/attachments/${attachmentId}`

        );

      return {

        success: true,

        attachment:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphAttachmentService.js
 * Part 4
 * Download Attachment + Delete Attachment
 ******************************************************************************/

/* ==========================================================================
   Download Attachment
========================================================================== */

async downloadAttachment({

  accessToken,

  messageId,

  attachmentId,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!attachmentId) {

    throw new Error(
      "Attachment Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/messages/${messageId}/attachments/${attachmentId}/$value`,

          {

            responseType: "arraybuffer",

          }

        );

      return {

        success: true,

        attachmentId,

        file: response.data,

      };

    }

  );

}

/* ==========================================================================
   Delete Attachment
========================================================================== */

async deleteAttachment({

  accessToken,

  messageId,

  attachmentId,

}) {

  if (!messageId) {

    throw new Error(
      "Message Id is required."
    );

  }

  if (!attachmentId) {

    throw new Error(
      "Attachment Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/messages/${messageId}/attachments/${attachmentId}`

      );

      return {

        success: true,

        attachmentId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphAttachmentService.js
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
        "Microsoft Graph Attachment Service",

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

    provider:
      "Microsoft Graph",

    service:
      "Attachment Service",

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

const graphAttachmentService =
  new GraphAttachmentService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphAttachmentService initialized."

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
  graphAttachmentService;

/******************************************************************************
 * End graphAttachmentService.js
 ******************************************************************************/
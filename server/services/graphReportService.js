/******************************************************************************
 * graphReportService.js
 * Part 1
 * Microsoft Graph Reports Service
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
   Graph Report Service
========================================================================== */

class GraphReportService {

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

      responseType: "arraybuffer",

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

          `[Graph Report Attempt ${attempt}]`,

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
 * graphReportService.js
 * Part 2
 * Email Activity User Detail + Email Activity Counts
 *
 * Paste INSIDE GraphReportService class
 ******************************************************************************/

/* ==========================================================================
   Email Activity User Detail
========================================================================== */

async getEmailActivityUserDetail({

  accessToken,

  period = "D7",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/reports/getEmailActivityUserDetail(period='${period}')`

        );

      return {

        success: true,

        report:
          response.data,

        period,

        generatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Email Activity Counts
========================================================================== */

async getEmailActivityCounts({

  accessToken,

  period = "D7",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/reports/getEmailActivityCounts(period='${period}')`

        );

      return {

        success: true,

        report:
          response.data,

        period,

        generatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphReportService.js
 * Part 3
 * Mailbox Usage Detail + Mailbox Usage Storage
 *
 * Paste INSIDE GraphReportService class
 ******************************************************************************/

/* ==========================================================================
   Mailbox Usage Detail
========================================================================== */

async getMailboxUsageDetail({

  accessToken,

  period = "D7",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/reports/getMailboxUsageDetail(period='${period}')`

        );

      return {

        success: true,

        report:
          response.data,

        period,

        generatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Mailbox Usage Storage
========================================================================== */

async getMailboxUsageStorage({

  accessToken,

  period = "D7",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/reports/getMailboxUsageStorage(period='${period}')`

        );

      return {

        success: true,

        report:
          response.data,

        period,

        generatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphReportService.js
 * Part 4
 * Office 365 Active User Detail + Office 365 Active User Counts
 *
 * Paste INSIDE GraphReportService class
 ******************************************************************************/

/* ==========================================================================
   Office 365 Active User Detail
========================================================================== */

async getOffice365ActiveUserDetail({

  accessToken,

  period = "D7",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/reports/getOffice365ActiveUserDetail(period='${period}')`

        );

      return {

        success: true,

        report:
          response.data,

        period,

        generatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Office 365 Active User Counts
========================================================================== */

async getOffice365ActiveUserCounts({

  accessToken,

  period = "D7",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/reports/getOffice365ActiveUserCounts(period='${period}')`

        );

      return {

        success: true,

        report:
          response.data,

        period,

        generatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphReportService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphReportService class
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

        "/reports/getOffice365ActiveUserCounts(period='D7')"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Report Service",

      status:
        "Healthy",

      reportAvailable:
        !!response.data,

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
      "Report Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Email Activity User Detail",

      "Email Activity Counts",

      "Mailbox Usage Detail",

      "Mailbox Usage Storage",

      "Office365 Active User Detail",

      "Office365 Active User Counts",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphReportService =
  new GraphReportService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphReportService initialized."

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
  graphReportService;

/******************************************************************************
 * End graphReportService.js
 ******************************************************************************/
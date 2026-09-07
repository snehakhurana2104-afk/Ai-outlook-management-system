/******************************************************************************
 * graphAuditService.js
 * Part 1
 * Microsoft Graph Audit Service
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
   Graph Audit Service
========================================================================== */

class GraphAuditService {

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

          `[Graph Audit Attempt ${attempt}]`,

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
 * graphAuditService.js
 * Part 2
 * Get Sign-In Logs + Get Directory Audit Logs
 *
 * Paste INSIDE GraphAuditService class
 ******************************************************************************/

/* ==========================================================================
   Get Sign-In Logs
========================================================================== */

async getSignInLogs({

  accessToken,

  top = 50,

  filter = "",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      let endpoint =
        `/auditLogs/signIns?$top=${top}`;

      if (filter) {

        endpoint +=
          `&$filter=${encodeURIComponent(filter)}`;

      }

      const response =
        await client.get(endpoint);

      return {

        success: true,

        total:
          response.data.value.length,

        signIns:
          response.data.value,

        nextLink:
          response.data["@odata.nextLink"] || null,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Directory Audit Logs
========================================================================== */

async getDirectoryAudits({

  accessToken,

  top = 50,

  filter = "",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      let endpoint =
        `/auditLogs/directoryAudits?$top=${top}`;

      if (filter) {

        endpoint +=
          `&$filter=${encodeURIComponent(filter)}`;

      }

      const response =
        await client.get(endpoint);

      return {

        success: true,

        total:
          response.data.value.length,

        audits:
          response.data.value,

        nextLink:
          response.data["@odata.nextLink"] || null,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphAuditService.js
 * Part 4
 * Get Risky Users + Get Audit Summary
 *
 * Paste INSIDE GraphAuditService class
 ******************************************************************************/

/* ==========================================================================
   Get Risky Users
========================================================================== */

async getRiskyUsers({

  accessToken,

  top = 50,

  filter = "",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      let endpoint =
        `/identityProtection/riskyUsers?$top=${top}`;

      if (filter) {

        endpoint +=
          `&$filter=${encodeURIComponent(filter)}`;

      }

      const response =
        await client.get(endpoint);

      return {

        success: true,

        total:
          response.data.value.length,

        riskyUsers:
          response.data.value,

        nextLink:
          response.data["@odata.nextLink"] || null,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Audit Summary
========================================================================== */

async getAuditSummary({

  accessToken,

}) {

  const [

    signIns,

    directoryAudits,

    provisioningLogs,

    riskDetections,

    riskyUsers,

  ] = await Promise.all([

    this.getSignInLogs({

      accessToken,

      top: 10,

    }),

    this.getDirectoryAudits({

      accessToken,

      top: 10,

    }),

    this.getProvisioningLogs({

      accessToken,

      top: 10,

    }),

    this.getRiskDetections({

      accessToken,

      top: 10,

    }),

    this.getRiskyUsers({

      accessToken,

      top: 10,

    }),

  ]);

  return {

    success: true,

    summary: {

      signIns:

        signIns.total || 0,

      directoryAudits:

        directoryAudits.total || 0,

      provisioningLogs:

        provisioningLogs.total || 0,

      riskDetections:

        riskDetections.total || 0,

      riskyUsers:

        riskyUsers.total || 0,

    },

    details: {

      signIns,

      directoryAudits,

      provisioningLogs,

      riskDetections,

      riskyUsers,

    },

    generatedAt:
      new Date().toISOString(),

  };

}
/******************************************************************************
 * graphAuditService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphAuditService class
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

        "/auditLogs/signIns?$top=1"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Audit Service",

      status:
        "Healthy",

      signInsAvailable:
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
      "Audit Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Sign-In Logs",

      "Directory Audits",

      "Provisioning Logs",

      "Risk Detections",

      "Risky Users",

      "Audit Summary",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphAuditService =
  new GraphAuditService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphAuditService initialized."

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
  graphAuditService;

/******************************************************************************
 * End graphAuditService.js
 ******************************************************************************/
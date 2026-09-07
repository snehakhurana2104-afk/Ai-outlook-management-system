/******************************************************************************
 * graphOrganizationService.js
 * Part 1
 * Microsoft Graph Organization Service
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
   Graph Organization Service
========================================================================== */

class GraphOrganizationService {

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

          `[Graph Organization Attempt ${attempt}]`,

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
 * graphOrganizationService.js
 * Part 2
 * Get Organization + Get Verified Domains
 *
 * Paste INSIDE GraphOrganizationService class
 ******************************************************************************/

/* ==========================================================================
   Get Organization
========================================================================== */

async getOrganization({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/organization"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        organizations:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Verified Domains
========================================================================== */

async getVerifiedDomains({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/organization"

        );

      const organization =

        response.data.value[0] || {};

      return {

        success: true,

        organizationId:
          organization.id,

        verifiedDomains:

          organization.verifiedDomains ||

          [],

      };

    }

  );

}
/******************************************************************************
 * graphOrganizationService.js
 * Part 3
 * Get Branding + Get Subscribed SKUs
 *
 * Paste INSIDE GraphOrganizationService class
 ******************************************************************************/

/* ==========================================================================
   Get Organization Branding
========================================================================== */

async getBranding({

  accessToken,

  locale = "default",

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/organization/${locale}/branding`

        );

      return {

        success: true,

        branding:
          response.data,

      };

    }

  );

}

/* ==========================================================================
   Get Microsoft 365 Licenses (Subscribed SKUs)
========================================================================== */

async getSubscribedSkus({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/subscribedSkus"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        skus:
          response.data.value,

      };

    }

  );

}
/******************************************************************************
 * graphOrganizationService.js
 * Part 4
 * Get Tenant Info + Organization Statistics
 *
 * Paste INSIDE GraphOrganizationService class
 ******************************************************************************/

/* ==========================================================================
   Get Tenant Information
========================================================================== */

async getTenantInfo({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/organization"

        );

      const tenant =

        response.data.value[0] || {};

      return {

        success: true,

        tenant,

      };

    }

  );

}

/* ==========================================================================
   Get Organization Statistics
========================================================================== */

async getOrganizationStatistics({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const orgResponse =
        await client.get(

          "/organization"

        );

      const skuResponse =
        await client.get(

          "/subscribedSkus"

        );

      const organization =

        orgResponse.data.value[0] || {};

      return {

        success: true,

        statistics: {

          organizationId:
            organization.id ||

            null,

          displayName:
            organization.displayName ||

            null,

          verifiedDomains:

            organization.verifiedDomains

              ? organization.verifiedDomains.length

              : 0,

          subscribedSkus:
            skuResponse.data.value.length,

          countryLetterCode:
            organization.countryLetterCode ||

            null,

          tenantType:
            organization.tenantType ||

            null,

        },

      };

    }

  );

}
/******************************************************************************
 * graphOrganizationService.js
 * Part 5
 * Health Check + Utilities + Export
 *
 * Paste INSIDE GraphOrganizationService class
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

        "/organization"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Organization Service",

      status:
        "Healthy",

      organization:

        response.data.value[0]?.displayName ||

        "Unknown",

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
      "Organization Service",

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

const graphOrganizationService =
  new GraphOrganizationService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphOrganizationService initialized."

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
  graphOrganizationService;

/******************************************************************************
 * End graphOrganizationService.js
 ******************************************************************************/
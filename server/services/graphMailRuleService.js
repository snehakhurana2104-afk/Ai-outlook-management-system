/******************************************************************************
 * graphMailRuleService.js
 * Part 1
 * Microsoft Graph Mail Rule Service
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
   Graph Mail Rule Service
========================================================================== */

class GraphMailRuleService {

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

          `[Graph Mail Rule Attempt ${attempt}]`,

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
 * graphMailRuleService.js
 * Part 2
 * Get Inbox Rules + Get Inbox Rule
 *
 * Paste INSIDE GraphMailRuleService class
 ******************************************************************************/

/* ==========================================================================
   Get All Inbox Rules
========================================================================== */

async getInboxRules({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/mailFolders/inbox/messageRules"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        rules:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Inbox Rule By Id
========================================================================== */

async getInboxRule({

  accessToken,

  ruleId,

}) {

  if (!ruleId) {

    throw new Error(
      "Rule Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/mailFolders/inbox/messageRules/${ruleId}`

        );

      return {

        success: true,

        rule:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphMailRuleService.js
 * Part 3
 * Create Inbox Rule + Update Inbox Rule
 *
 * Paste INSIDE GraphMailRuleService class
 ******************************************************************************/

/* ==========================================================================
   Create Inbox Rule
========================================================================== */

async createInboxRule({

  accessToken,

  displayName,

  sequence = 1,

  isEnabled = true,

  conditions = {},

  actions = {},

}) {

  if (!displayName) {

    throw new Error(
      "Rule name is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        displayName,

        sequence,

        isEnabled,

        conditions,

        actions,

      };

      const response =
        await client.post(

          "/me/mailFolders/inbox/messageRules",

          payload

        );

      return {

        success: true,

        rule:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Update Inbox Rule
========================================================================== */

async updateInboxRule({

  accessToken,

  ruleId,

  updates = {},

}) {

  if (!ruleId) {

    throw new Error(
      "Rule Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          `/me/mailFolders/inbox/messageRules/${ruleId}`,

          updates

        );

      return {

        success: true,

        ruleId,

        rule:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphMailRuleService.js
 * Part 4
 * Delete Inbox Rule + Enable Rule + Disable Rule
 *
 * Paste INSIDE GraphMailRuleService class
 ******************************************************************************/

/* ==========================================================================
   Delete Inbox Rule
========================================================================== */

async deleteInboxRule({

  accessToken,

  ruleId,

}) {

  if (!ruleId) {

    throw new Error(
      "Rule Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/mailFolders/inbox/messageRules/${ruleId}`

      );

      return {

        success: true,

        ruleId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Enable Inbox Rule
========================================================================== */

async enableInboxRule({

  accessToken,

  ruleId,

}) {

  if (!ruleId) {

    throw new Error(
      "Rule Id is required."
    );

  }

  return await this.updateInboxRule({

    accessToken,

    ruleId,

    updates: {

      isEnabled: true,

    },

  });

}

/* ==========================================================================
   Disable Inbox Rule
========================================================================== */

async disableInboxRule({

  accessToken,

  ruleId,

}) {

  if (!ruleId) {

    throw new Error(
      "Rule Id is required."
    );

  }

  return await this.updateInboxRule({

    accessToken,

    ruleId,

    updates: {

      isEnabled: false,

    },

  });

}
/******************************************************************************
 * graphMailRuleService.js
 * Part 5
 * Health Check + Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphMailRuleService class
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

        "/me/mailFolders/inbox/messageRules"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Mail Rule Service",

      status:
        "Healthy",

      totalRules:
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
      "Mail Rule Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Get Inbox Rules",

      "Get Inbox Rule",

      "Create Inbox Rule",

      "Update Inbox Rule",

      "Delete Inbox Rule",

      "Enable Inbox Rule",

      "Disable Inbox Rule",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphMailRuleService =
  new GraphMailRuleService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphMailRuleService initialized."

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
  graphMailRuleService;

/******************************************************************************
 * End graphMailRuleService.js
 ******************************************************************************/
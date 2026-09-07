/******************************************************************************
 * graphContactService.js
 * Part 1
 * Microsoft Graph Contact Service
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
   Graph Contact Service
========================================================================== */

class GraphContactService {

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

          `[Graph Contact Attempt ${attempt}]`,

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
 * graphContactService.js
 * Part 2
 * Get Contacts + Get Contact
 ******************************************************************************/

/* ==========================================================================
   Get Contacts
========================================================================== */

async getContacts({

  accessToken,

  top = 100,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/contacts?$top=${top}`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        contacts:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Contact
========================================================================== */

async getContact({

  accessToken,

  contactId,

}) {

  if (!contactId) {

    throw new Error(
      "Contact Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/contacts/${contactId}`

        );

      return {

        success: true,

        contact:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphContactService.js
 * Part 3
 * Create Contact + Update Contact
 ******************************************************************************/

/* ==========================================================================
   Create Contact
========================================================================== */

async createContact({

  accessToken,

  givenName,

  surname = "",

  email,

  mobilePhone = "",

  companyName = "",

  jobTitle = "",

}) {

  if (!givenName) {

    throw new Error(
      "Given name is required."
    );

  }

  if (!email) {

    throw new Error(
      "Email address is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        givenName,

        surname,

        companyName,

        jobTitle,

        mobilePhone,

        emailAddresses: [

          {

            address: email,

            name: `${givenName} ${surname}`.trim(),

          },

        ],

      };

      const response =
        await client.post(

          "/me/contacts",

          payload

        );

      return {

        success: true,

        contactId:
          response.data.id,

        contact:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Update Contact
========================================================================== */

async updateContact({

  accessToken,

  contactId,

  givenName,

  surname,

  email,

  mobilePhone,

  companyName,

  jobTitle,

}) {

  if (!contactId) {

    throw new Error(
      "Contact Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {};

      if (givenName !== undefined)
        payload.givenName = givenName;

      if (surname !== undefined)
        payload.surname = surname;

      if (companyName !== undefined)
        payload.companyName = companyName;

      if (jobTitle !== undefined)
        payload.jobTitle = jobTitle;

      if (mobilePhone !== undefined)
        payload.mobilePhone = mobilePhone;

      if (email !== undefined) {

        payload.emailAddresses = [

          {

            address: email,

            name: `${givenName || ""} ${surname || ""}`.trim(),

          },

        ];

      }

      const response =
        await client.patch(

          `/me/contacts/${contactId}`,

          payload

        );

      return {

        success: true,

        contactId,

        contact: response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphContactService.js
 * Part 4
 * Delete Contact + Search Contacts + Suggest Contacts
 ******************************************************************************/

/* ==========================================================================
   Delete Contact
========================================================================== */

async deleteContact({

  accessToken,

  contactId,

}) {

  if (!contactId) {

    throw new Error(
      "Contact Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/contacts/${contactId}`

      );

      return {

        success: true,

        contactId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Search Contacts
========================================================================== */

async searchContacts({

  accessToken,

  query,

}) {

  if (!query) {

    throw new Error(
      "Search query is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/contacts?$filter=startswith(displayName,'${query}')`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        contacts:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Suggest Contacts
========================================================================== */

async suggestContacts({

  accessToken,

  query,

  limit = 5,

}) {

  const result =
    await this.searchContacts({

      accessToken,

      query,

    });

  return {

    success: true,

    suggestions:
      result.contacts.slice(0, limit),

  };

}
/******************************************************************************
 * graphContactService.js
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
        "Microsoft Graph Contact Service",

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
      "Contact Service",

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

const graphContactService =
  new GraphContactService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphContactService initialized."

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
  graphContactService;

/******************************************************************************
 * End graphContactService.js
 ******************************************************************************/
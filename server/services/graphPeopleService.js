/******************************************************************************
 * graphPeopleService.js
 * Part 1
 * Microsoft Graph People Service
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
   Graph People Service
========================================================================== */

class GraphPeopleService {

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

          `[Graph People Attempt ${attempt}]`,

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
 * graphPeopleService.js
 * Part 2
 * Get People + Get Person
 *
 * Paste INSIDE GraphPeopleService class
 ******************************************************************************/

/* ==========================================================================
   Get People
========================================================================== */

async getPeople({

  accessToken,

  top = 25,

  skip = 0,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/people?$top=${top}&$skip=${skip}`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        people:
          response.data.value,

        nextLink:
          response.data["@odata.nextLink"] || null,

      };

    }

  );

}

/* ==========================================================================
   Get Person By Id
========================================================================== */

async getPerson({

  accessToken,

  personId,

}) {

  if (!personId) {

    throw new Error(
      "Person Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/people/${personId}`

        );

      return {

        success: true,

        person:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphPeopleService.js
 * Part 3
 * Search People + Get Relevant People
 *
 * Paste INSIDE GraphPeopleService class
 ******************************************************************************/

/* ==========================================================================
   Search People
========================================================================== */

async searchPeople({

  accessToken,

  query,

  top = 25,

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

          `/me/people`,

          {

            params: {

              $search: `"${query}"`,

              $top: top,

            },

          }

        );

      return {

        success: true,

        query,

        total:
          response.data.value.length,

        people:
          response.data.value,

        searchedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Relevant People
========================================================================== */

async getRelevantPeople({

  accessToken,

  top = 20,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/people",

          {

            params: {

              $top: top,

            },

          }

        );

      const people =
        response.data.value || [];

      return {

        success: true,

        total:
          people.length,

        people,

        fetchedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphPeopleService.js
 * Part 4
 * Get Contacts + Get Contact + Create Contact
 *
 * Paste INSIDE GraphPeopleService class
 ******************************************************************************/

/* ==========================================================================
   Get Contacts
========================================================================== */

async getContacts({

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

          "/me/contacts",

          {

            params: {

              $top: top,

              $skip: skip,

            },

          }

        );

      return {

        success: true,

        total:
          response.data.value.length,

        contacts:
          response.data.value,

        nextLink:
          response.data["@odata.nextLink"] || null,

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

/* ==========================================================================
   Create Contact
========================================================================== */

async createContact({

  accessToken,

  givenName,

  surname,

  email,

  companyName,

  mobilePhone,

  businessPhone,

}) {

  if (!givenName) {

    throw new Error(
      "Given name is required."
    );

  }

  if (!email) {

    throw new Error(
      "Email is required."
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

        mobilePhone,

        businessPhones:
          businessPhone
            ? [businessPhone]
            : [],

        emailAddresses: [

          {

            address: email,

            name:
              `${givenName} ${surname || ""}`.trim(),

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

        contact:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphPeopleService.js
 * Part 5
 * Update Contact + Delete Contact + Health Check
 * Error Mapping + Service Info + Singleton + Export
 *
 * Paste INSIDE GraphPeopleService class
 ******************************************************************************/

/* ==========================================================================
   Update Contact
========================================================================== */

async updateContact({

  accessToken,

  contactId,

  updates = {},

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
        await client.patch(

          `/me/contacts/${contactId}`,

          updates

        );

      return {

        success: true,

        contactId,

        contact:
          response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}

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

        "/me/people?$top=1"

      );

    return {

      success: true,

      service:
        "Microsoft Graph People Service",

      status:
        "Healthy",

      peopleFound:
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
      "People Service",

    version:
      "v1.0",

    endpoint:
      this.baseURL,

    timeout:
      this.timeout,

    retries:
      this.maxRetries,

    supports: [

      "Get People",

      "Get Person",

      "Search People",

      "Relevant People",

      "Get Contacts",

      "Get Contact",

      "Create Contact",

      "Update Contact",

      "Delete Contact",

    ],

  };

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const graphPeopleService =
  new GraphPeopleService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphPeopleService initialized."

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
  graphPeopleService;

/******************************************************************************
 * End graphPeopleService.js
 ******************************************************************************/
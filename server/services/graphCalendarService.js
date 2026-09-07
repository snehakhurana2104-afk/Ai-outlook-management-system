/******************************************************************************
 * graphCalendarService.js
 * Part 1
 * Microsoft Graph Calendar Service
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
   Graph Calendar Service
========================================================================== */

class GraphCalendarService {

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

          `[Graph Calendar Attempt ${attempt}]`,

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
 * graphCalendarService.js
 * Part 2
 * Create Event + Get Event
 ******************************************************************************/

/* ==========================================================================
   Create Calendar Event
========================================================================== */

async createEvent({

  accessToken,

  subject,

  body = "",

  start,

  end,

  timeZone = "UTC",

  attendees = [],

  location = "",

}) {

  if (!subject) {

    throw new Error(
      "Event subject is required."
    );

  }

  if (!start || !end) {

    throw new Error(
      "Start and End time are required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        subject,

        body: {

          contentType: "HTML",

          content: body,

        },

        start: {

          dateTime: start,

          timeZone,

        },

        end: {

          dateTime: end,

          timeZone,

        },

        location: {

          displayName: location,

        },

        attendees:

          attendees.map((email) => ({

            emailAddress: {

              address: email,

            },

            type: "required",

          })),

      };

      const response =
        await client.post(

          "/me/events",

          payload

        );

      return {

        success: true,

        eventId:
          response.data.id,

        event:
          response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Get Calendar Event
========================================================================== */

async getEvent({

  accessToken,

  eventId,

}) {

  if (!eventId) {

    throw new Error(
      "Event Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/events/${eventId}`

        );

      return {

        success: true,

        event:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphCalendarService.js
 * Part 3
 * Update Event + Delete Event
 ******************************************************************************/

/* ==========================================================================
   Update Calendar Event
========================================================================== */

async updateEvent({

  accessToken,

  eventId,

  subject,

  body,

  start,

  end,

  timeZone = "UTC",

  attendees,

  location,

}) {

  if (!eventId) {

    throw new Error(
      "Event Id is required."
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

      if (start !== undefined) {

        payload.start = {

          dateTime: start,

          timeZone,

        };

      }

      if (end !== undefined) {

        payload.end = {

          dateTime: end,

          timeZone,

        };

      }

      if (location !== undefined) {

        payload.location = {

          displayName: location,

        };

      }

      if (Array.isArray(attendees)) {

        payload.attendees = attendees.map(

          (email) => ({

            emailAddress: {

              address: email,

            },

            type: "required",

          })

        );

      }

      const response =
        await client.patch(

          `/me/events/${eventId}`,

          payload

        );

      return {

        success: true,

        eventId,

        event: response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Delete Calendar Event
========================================================================== */

async deleteEvent({

  accessToken,

  eventId,

}) {

  if (!eventId) {

    throw new Error(
      "Event Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/events/${eventId}`

      );

      return {

        success: true,

        eventId,

        deletedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphCalendarService.js
 * Part 4
 * List Events + Date Range + Meeting Invite + Cancel Event
 ******************************************************************************/

/* ==========================================================================
   List Events
========================================================================== */

async listEvents({

  accessToken,

  top = 25,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/events?$top=${top}&$orderby=start/dateTime`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        events:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Find Events By Date Range
========================================================================== */

async findEventsByDateRange({

  accessToken,

  startDate,

  endDate,

}) {

  if (!startDate || !endDate) {

    throw new Error(

      "Start date and End date are required."

    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/calendarView?startDateTime=${encodeURIComponent(startDate)}&endDateTime=${encodeURIComponent(endDate)}`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        events:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Create Meeting Invite
========================================================================== */

async createMeetingInvite({

  accessToken,

  subject,

  body,

  start,

  end,

  attendees,

  location = "",

  timeZone = "UTC",

}) {

  return await this.createEvent({

    accessToken,

    subject,

    body,

    start,

    end,

    attendees,

    location,

    timeZone,

  });

}

/* ==========================================================================
   Cancel Event
========================================================================== */

async cancelEvent({

  accessToken,

  eventId,

  comment = "Meeting cancelled.",

}) {

  if (!eventId) {

    throw new Error(

      "Event Id is required."

    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.post(

        `/me/events/${eventId}/cancel`,

        {

          Comment: comment,

        }

      );

      return {

        success: true,

        eventId,

        cancelledAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphCalendarService.js
 * Part 5
 * Utilities + Export
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
        "Microsoft Graph Calendar Service",

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
   Enterprise Graph Error Mapping
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
      "Calendar Service",

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
   Singleton
========================================================================== */

const graphCalendarService =
  new GraphCalendarService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphCalendarService initialized."

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
  graphCalendarService;

/******************************************************************************
 * End graphCalendarService.js
 ******************************************************************************/
"use strict";

const axios = require("axios");

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

/* ============================================================
   GRAPH REQUEST
============================================================ */

const graphRequest = async ({
  token,
  method = "GET",
  url,
  data,
  params,
  headers = {},
}) => {
  if (!token) {
    const error = new Error(
      "Microsoft Graph access token is required."
    );

    error.status = 401;
    throw error;
  }

  try {
    const response = await axios({
      method,
      url,
      params,
      data,

      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",

        // Outlook dates ko readable timezone mein return karne mein help karta hai
        Prefer: 'outlook.timezone="India Standard Time"',

        ...headers,
      },

      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error(
      "[GraphService] Graph API Error:",
      {
        status: error?.response?.status,
        data: error?.response?.data,
        url,
        method,
      }
    );

    throw error;
  }
};


/* ============================================================
   GET CALENDAR EVENTS
============================================================ */

const getCalendarEvents = async (
  token,
  {
    startDateTime,
    endDateTime,
    top = 100,
  } = {}
) => {
  const start =
    startDateTime ||
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ).toISOString();

  const end =
    endDateTime ||
    new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
      23,
      59,
      59
    ).toISOString();

  let url =
    `${GRAPH_BASE_URL}/me/calendarView`;

  let events = [];

  let params = {
    startDateTime: start,
    endDateTime: end,

    $top: Math.min(
      Math.max(Number(top) || 100, 1),
      1000
    ),

    $orderby: "start/dateTime",

    $select: [
      "id",
      "subject",
      "body",
      "bodyPreview",
      "start",
      "end",
      "location",
      "organizer",
      "attendees",
      "isAllDay",
      "isCancelled",
      "webLink",
      "onlineMeeting",
      "onlineMeetingUrl",
      "responseStatus",
      "showAs",
      "sensitivity",
      "createdDateTime",
      "lastModifiedDateTime",
      "categories",
    ].join(","),
  };

  let firstRequest = true;

  while (url) {
    const response = await graphRequest({
      token,
      method: "GET",
      url,

      params: firstRequest
        ? params
        : undefined,
    });

    firstRequest = false;

    if (
      Array.isArray(response?.value)
    ) {
      events.push(
        ...response.value
      );
    }

    url =
      response?.["@odata.nextLink"] ||
      null;
  }

  return {
    value: events,
    "@odata.count": events.length,
  };
};


/* ============================================================
   CREATE CALENDAR EVENT
============================================================ */

const createCalendarEvent = async (
  token,
  event
) => {
  const {
    subject,
    body,
    startDateTime,
    endDateTime,
    timeZone = "India Standard Time",
    location,
    attendees = [],
    isAllDay = false,
  } = event || {};

  const payload = {
    subject: String(
      subject || ""
    ).trim(),

    body: {
      content:
        body || "",
      contentType: "HTML",
    },

    start: {
      dateTime:
        normalizeGraphDateTime(
          startDateTime
        ),
      timeZone,
    },

    end: {
      dateTime:
        normalizeGraphDateTime(
          endDateTime
        ),
      timeZone,
    },

    isAllDay: Boolean(
      isAllDay
    ),
  };


  if (location) {
    payload.location = {
      displayName:
        typeof location === "string"
          ? location
          : location.displayName || "",
    };
  }


  if (
    Array.isArray(attendees) &&
    attendees.length
  ) {
    payload.attendees =
      attendees
        .filter(
          (a) =>
            a?.email ||
            a?.address
        )
        .map((a) => ({
          emailAddress: {
            address:
              a.email ||
              a.address,

            name:
              a.name ||
              a.email ||
              a.address,
          },

          type:
            a.type ||
            "required",
        }));
  }


  return graphRequest({
    token,
    method: "POST",

    url:
      `${GRAPH_BASE_URL}/me/events`,

    data: payload,
  });
};


/* ============================================================
   UPDATE CALENDAR EVENT
============================================================ */

const updateCalendarEvent = async (
  token,
  eventId,
  event
) => {
  if (!eventId) {
    const error =
      new Error(
        "Event ID is required."
      );

    error.status = 400;
    throw error;
  }

  const payload = {};

  if (
    typeof event.subject ===
    "string"
  ) {
    payload.subject =
      event.subject.trim();
  }

  if (
    typeof event.body ===
    "string"
  ) {
    payload.body = {
      content: event.body,
      contentType: "HTML",
    };
  }

  if (
    event.startDateTime
  ) {
    payload.start = {
      dateTime:
        normalizeGraphDateTime(
          event.startDateTime
        ),
      timeZone:
        event.timeZone ||
        "India Standard Time",
    };
  }

  if (
    event.endDateTime
  ) {
    payload.end = {
      dateTime:
        normalizeGraphDateTime(
          event.endDateTime
        ),
      timeZone:
        event.timeZone ||
        "India Standard Time",
    };
  }

  if (
    event.location !==
    undefined
  ) {
    payload.location = {
      displayName:
        typeof event.location ===
        "string"
          ? event.location
          : event.location?.displayName ||
            "",
    };
  }

  if (
    typeof event.isAllDay ===
    "boolean"
  ) {
    payload.isAllDay =
      event.isAllDay;
  }

  if (
    Array.isArray(
      event.attendees
    )
  ) {
    payload.attendees =
      event.attendees
        .filter(
          (a) =>
            a?.email ||
            a?.address
        )
        .map((a) => ({
          emailAddress: {
            address:
              a.email ||
              a.address,

            name:
              a.name ||
              a.email ||
              a.address,
          },

          type:
            a.type ||
            "required",
        }));
  }

  return graphRequest({
    token,
    method: "PATCH",

    url:
      `${GRAPH_BASE_URL}/me/events/${encodeURIComponent(
        eventId
      )}`,

    data: payload,
  });
};


/* ============================================================
   DELETE CALENDAR EVENT
============================================================ */

const deleteCalendarEvent = async (
  token,
  eventId
) => {
  if (!eventId) {
    const error =
      new Error(
        "Event ID is required."
      );

    error.status = 400;
    throw error;
  }

  return graphRequest({
    token,
    method: "DELETE",

    url:
      `${GRAPH_BASE_URL}/me/events/${encodeURIComponent(
        eventId
      )}`,
  });
};


/* ============================================================
   GET SINGLE CALENDAR EVENT
============================================================ */

const getCalendarEventById = async (
  token,
  eventId
) => {
  return graphRequest({
    token,
    method: "GET",

    url:
      `${GRAPH_BASE_URL}/me/events/${encodeURIComponent(
        eventId
      )}`,

    params: {
      $select: [
        "id",
        "subject",
        "body",
        "bodyPreview",
        "start",
        "end",
        "location",
        "organizer",
        "attendees",
        "isAllDay",
        "isCancelled",
        "webLink",
        "onlineMeeting",
        "onlineMeetingUrl",
        "responseStatus",
        "showAs",
        "sensitivity",
        "createdDateTime",
        "lastModifiedDateTime",
      ].join(","),
    },
  });
};


/* ============================================================
   DATE NORMALIZER
============================================================ */

function normalizeGraphDateTime(
  value
) {
  if (!value) {
    return new Date().toISOString();
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `Invalid date: ${value}`
    );
  }

  return date.toISOString();
}


/* ============================================================
   EXPORT
============================================================ */

module.exports = {
  graphRequest,

  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventById,
};
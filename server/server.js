/******************************************************************************
 * server.js
 * AI Outlook Management System
 *
 * Enterprise Express + Socket.IO + MongoDB + Microsoft Graph
 *
 * CommonJS
 * Version: 6.1.0
 ******************************************************************************/

"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

/* ============================================================================
   CONFIG
============================================================================ */

const PORT = Number(process.env.PORT) || 5000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/ai_outlook_system";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:3000";

const NODE_ENV =
  process.env.NODE_ENV ||
  "development";

const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

const SERVER_VERSION =
  "6.1.0";

const OUTLOOK_TIME_ZONE =
  "India Standard Time";

const OUTLOOK_IANA_TIME_ZONE =
  "Asia/Kolkata";

/* ============================================================================
   EXPRESS / HTTP
============================================================================ */

const app = express();

const httpServer =
  http.createServer(app);

/* ============================================================================
   CORS
============================================================================ */

const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

const uniqueAllowedOrigins = [
  ...new Set(allowedOrigins),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        uniqueAllowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      console.warn(
        `[CORS] Blocked origin: ${origin}`
      );

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

/* ============================================================================
   BODY PARSERS
============================================================================ */

app.use(
  express.json({
    limit: "20mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

/* ============================================================================
   REQUEST LOGGER
============================================================================ */

app.use(
  (req, res, next) => {
    const started =
      Date.now();

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
    );

    res.on(
      "finish",
      () => {
        const duration =
          Date.now() - started;

        console.log(
          `[Response] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
        );
      }
    );

    next();
  }
);

/* ============================================================================
   SOCKET.IO
============================================================================ */

const io =
  new Server(
    httpServer,
    {
      cors: {
        origin:
          uniqueAllowedOrigins,

        methods: [
          "GET",
          "POST",
        ],

        credentials:
          true,
      },

      transports: [
        "websocket",
        "polling",
      ],
    }
  );

app.set(
  "io",
  io
);

/* ============================================================================
   SOCKET EVENTS
============================================================================ */

io.on(
  "connection",
  (socket) => {
    console.log(
      `[Socket.IO] Connected: ${socket.id}`
    );

    socket.on(
      "join:user",
      (userId) => {
        if (!userId) {
          return;
        }

        const room =
          `user:${String(userId)}`;

        socket.join(room);

        socket.emit(
          "joined:user",
          {
            success: true,
            room,
            timestamp:
              new Date().toISOString(),
          }
        );
      }
    );

    socket.on(
      "ping",
      () => {
        socket.emit(
          "pong",
          {
            success: true,
            timestamp:
              new Date().toISOString(),
          }
        );
      }
    );

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          `[Socket.IO] Disconnected: ${socket.id} (${reason})`
        );
      }
    );

    socket.on(
      "error",
      (error) => {
        console.error(
          `[Socket.IO] Error ${socket.id}:`,
          error
        );
      }
    );
  }
);

/* ============================================================================
   COMMON HELPERS
============================================================================ */

const isValidDateString =
  (value) => {
    if (
      typeof value !==
      "string"
    ) {
      return false;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        value
      )
    ) {
      return false;
    }

    const date =
      new Date(
        `${value}T00:00:00Z`
      );

    return (
      !Number.isNaN(
        date.getTime()
      ) &&
      date
        .toISOString()
        .slice(0, 10) ===
        value
    );
  };

const getTodayIST =
  () => {
    const now =
      new Date();

    const parts =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            OUTLOOK_IANA_TIME_ZONE,

          year:
            "numeric",

          month:
            "2-digit",

          day:
            "2-digit",
        }
      ).formatToParts(now);

    const map = {};

    for (
      const part of parts
    ) {
      if (
        part.type !==
        "literal"
      ) {
        map[part.type] =
          part.value;
      }
    }

    return (
      `${map.year}-${map.month}-${map.day}`
    );
  };

const addDaysToDateString =
  (
    dateString,
    days
  ) => {
    const date =
      new Date(
        `${dateString}T00:00:00Z`
      );

    date.setUTCDate(
      date.getUTCDate() +
        days
    );

    return date
      .toISOString()
      .slice(0, 10);
  };

const normalizeTop =
  (
    value,
    fallback = 100,
    max = 500
  ) => {
    const parsed =
      Number(value);

    if (
      !Number.isFinite(parsed)
    ) {
      return fallback;
    }

    return Math.min(
      Math.max(
        Math.floor(parsed),
        1
      ),
      max
    );
  };

/* ============================================================================
   GRAPH TOKEN MIDDLEWARE
============================================================================ */

const requireGraphToken =
  (req, res, next) => {
    try {
      const authorization =
        req.headers.authorization;

      if (
        !authorization ||
        !authorization.startsWith(
          "Bearer "
        )
      ) {
        return res.status(401).json({
          success: false,
          connected: false,
          message:
            "Microsoft Graph access token is missing.",
          code:
            "GRAPH_TOKEN_MISSING",
        });
      }

      const token =
        authorization
          .substring(7)
          .trim();

      if (!token) {
        return res.status(401).json({
          success: false,
          connected: false,
          message:
            "Microsoft Graph access token is empty.",
          code:
            "GRAPH_TOKEN_EMPTY",
        });
      }

      req.graphToken =
        token;

      next();
    } catch (error) {
      console.error(
        "[Graph Token Middleware]",
        error
      );

      return res.status(401).json({
        success: false,
        connected: false,
        message:
          "Invalid Microsoft Graph authorization header.",
        code:
          "GRAPH_TOKEN_INVALID",
      });
    }
  };

/* ============================================================================
   GRAPH REQUEST
============================================================================ */

const graphRequest =
  async (
    endpoint,
    token,
    options = {}
  ) => {
    const requestUrl =
      endpoint.startsWith(
        "http://"
      ) ||
      endpoint.startsWith(
        "https://"
      )
        ? endpoint
        : `${GRAPH_BASE_URL}${endpoint}`;

    const requestOptions = {
      method:
        options.method ||
        "GET",

      headers: {
        Authorization:
          `Bearer ${token}`,

        Accept:
          "application/json",

        ...(options.headers || {}),
      },
    };

    if (
      options.body !==
        undefined &&
      options.body !==
        null
    ) {
      requestOptions.body =
        options.body;
    }

    console.log(
      `[Graph] ${requestOptions.method} ${requestUrl}`
    );

    const response =
      await fetch(
        requestUrl,
        requestOptions
      );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data = null;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      const text =
        await response.text();

      data =
        text || null;
    }

    if (!response.ok) {
      const graphMessage =
        data &&
        typeof data ===
          "object" &&
        data.error &&
        data.error.message
          ? data.error.message
          : `Microsoft Graph returned ${response.status}`;

      const error =
        new Error(
          graphMessage
        );

      error.status =
        response.status;

      error.statusCode =
        response.status;

      error.graphResponse =
        data;

      error.requestUrl =
        requestUrl;

      throw error;
    }

    return data;
  };

/* ============================================================================
   GRAPH PAGINATION
============================================================================ */

const getAllGraphPages =
  async ({
    endpoint,
    token,
    maxItems = 5000,
  }) => {
    const items = [];

    let nextUrl =
      endpoint;

    while (
      nextUrl &&
      items.length <
        maxItems
    ) {
      const data =
        await graphRequest(
          nextUrl,
          token
        );

      const page =
        Array.isArray(
          data?.value
        )
          ? data.value
          : [];

      items.push(
        ...page
      );

      nextUrl =
        data?.[
          "@odata.nextLink"
        ] || null;

      if (
        page.length ===
        0
      ) {
        break;
      }
    }

    return items.slice(
      0,
      maxItems
    );
  };

/* ============================================================================
   OUTLOOK MESSAGE FIELDS
============================================================================ */

const OUTLOOK_MESSAGE_SELECT_FIELDS =
  [
    "id",
    "subject",
    "from",
    "sender",
    "toRecipients",
    "ccRecipients",
    "receivedDateTime",
    "sentDateTime",
    "bodyPreview",
    "isRead",
    "importance",
    "flag",
    "categories",
    "conversationId",
    "hasAttachments",
    "webLink",
    "isDraft",
  ].join(",");

/* ============================================================================
   INBOX ENDPOINT BUILDER
============================================================================ */

const buildInboxEndpoint =
  ({
    top = 100,
    startDate,
    endDate,
  } = {}) => {
    const safeTop =
      normalizeTop(
        top,
        100,
        100
      );

    const params =
      new URLSearchParams();

    params.set(
      "$top",
      String(safeTop)
    );

    params.set(
      "$select",
      OUTLOOK_MESSAGE_SELECT_FIELDS
    );

    params.set(
      "$orderby",
      "receivedDateTime desc"
    );

    if (
      startDate &&
      endDate &&
      isValidDateString(
        startDate
      ) &&
      isValidDateString(
        endDate
      )
    ) {
      params.set(
        "$filter",
        `receivedDateTime ge ${startDate}T00:00:00Z and receivedDateTime lt ${addDaysToDateString(
          endDate,
          1
        )}T00:00:00Z`
      );
    }

    return (
      `/me/mailFolders/inbox/messages?${params.toString()}`
    );
  };

/* ============================================================================
   MESSAGE RESPONSE
============================================================================ */

const formatOutlookMessagesResponse =
  ({
    data,
    folder = "Inbox",
  }) => {
    const emails =
      Array.isArray(
        data?.value
      )
        ? data.value
        : [];

    return {
      success: true,

      connected: true,

      count:
        emails.length,

      emails,

      value:
        emails,

      messages:
        emails,

      nextLink:
        data?.[
          "@odata.nextLink"
        ] || null,

      source: {
        provider:
          "Microsoft Graph",

        folder,
      },

      timestamp:
        new Date().toISOString(),
    };
  };

/* ============================================================================
   TASK HELPERS
============================================================================ */

const normalizeTaskDueDate =
  (dueDateTime) => {
    if (!dueDateTime) {
      return null;
    }

    if (
      typeof dueDateTime ===
      "string"
    ) {
      return dueDateTime;
    }

    const dateTime =
      dueDateTime.dateTime;

    if (!dateTime) {
      return null;
    }

    const timeZone =
      String(
        dueDateTime.timeZone ||
          ""
      ).toUpperCase();

    if (
      timeZone ===
      "UTC"
    ) {
      return dateTime.endsWith(
        "Z"
      )
        ? dateTime
        : `${dateTime}Z`;
    }

    return dateTime;
  };

const normalizeGraphTask =
  ({
    task,
    list,
  }) => {
    const bodyContent =
      task?.body?.content ||
      "";

    const bodyPreview =
      String(
        bodyContent
      )
        .replace(
          /<[^>]*>/g,
          " "
        )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    return {
      id:
        task?.id ||
        "",

      title:
        task?.title ||
        "Untitled task",

      status:
        task?.status ||
        "notStarted",

      importance:
        task?.importance ||
        "normal",

      listId:
        list?.id ||
        "",

      listName:
        list?.displayName ||
        "Tasks",

      bodyPreview,

      body:
        task?.body ||
        null,

      dueDateTime:
        normalizeTaskDueDate(
          task?.dueDateTime
        ),

      completedDateTime:
        task?.completedDateTime ||
        null,

      createdDateTime:
        task?.createdDateTime ||
        null,

      lastModifiedDateTime:
        task?.lastModifiedDateTime ||
        null,

      recurrence:
        task?.recurrence ||
        null,

      checklistItems:
        Array.isArray(
          task?.checklistItems
        )
          ? task.checklistItems
          : [],

      linkedResources:
        Array.isArray(
          task?.linkedResources
        )
          ? task.linkedResources
          : [],

      webLink:
        task?.webLink ||
        null,
    };
  };

const normalizeTaskStatus =
  (status) => {
    const value =
      String(
        status || ""
      )
        .trim()
        .toLowerCase();

    const map = {
      completed:
        "completed",

      notstarted:
        "notStarted",

      "not-started":
        "notStarted",

      "not_started":
        "notStarted",

      inprogress:
        "inProgress",

      "in-progress":
        "inProgress",

      "in_progress":
        "inProgress",

      waitingonothers:
        "waitingOnOthers",

      "waiting-on-others":
        "waitingOnOthers",

      deferred:
        "deferred",
    };

    return (
      map[value] ||
      null
    );
  };

const normalizeImportance =
  (importance) => {
    const value =
      String(
        importance || ""
      )
        .trim()
        .toLowerCase();

    if (
      [
        "low",
        "normal",
        "high",
      ].includes(value)
    ) {
      return value;
    }

    return null;
  };

const buildDueDatePayload =
  (value) => {
    if (
      value ===
        undefined ||
      value ===
        null ||
      value ===
        ""
    ) {
      return null;
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }

    return {
      dateTime:
        date.toISOString(),

      timeZone:
        "UTC",
    };
  };

/* ============================================================================
   ROOT
============================================================================ */

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,

      message:
        "AI Outlook Management System API is running.",

      service:
        "AI Outlook Backend",

      version:
        SERVER_VERSION,

      environment:
        NODE_ENV,

      graph:
        GRAPH_BASE_URL,

      timezone:
        OUTLOOK_TIME_ZONE,

      todayIST:
        getTodayIST(),

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ============================================================================
   BASIC HEALTH
============================================================================ */

app.get(
  "/health",
  (req, res) => {
    const databaseConnected =
      mongoose.connection.readyState ===
      1;

    res.status(
      databaseConnected
        ? 200
        : 503
    ).json({
      success:
        databaseConnected,

      status:
        databaseConnected
          ? "healthy"
          : "database_disconnected",

      database:
        databaseConnected
          ? "connected"
          : "disconnected",

      databaseName:
        mongoose.connection.name ||
        null,

      timezone:
        OUTLOOK_TIME_ZONE,

      todayIST:
        getTodayIST(),

      socketIO: {
        enabled: true,

        connectedClients:
          io.engine?.clientsCount ||
          0,
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ============================================================================
   OUTLOOK STATUS
============================================================================ */

app.get(
  "/api/outlook/status",
  requireGraphToken,
  async (req, res) => {
    try {
      const me =
        await graphRequest(
          "/me?$select=id,displayName,mail,userPrincipalName",
          req.graphToken
        );

      return res.json({
        success: true,

        connected: true,

        user:
          me,

        graph:
          GRAPH_BASE_URL,

        timezone:
          OUTLOOK_TIME_ZONE,

        todayIST:
          getTodayIST(),

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Outlook Status]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected: false,

        message:
          error.message ||
          "Unable to connect to Microsoft Outlook.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   OUTLOOK PROFILE
============================================================================ */

const outlookProfileHandler =
  async (req, res) => {
    try {
      const data =
        await graphRequest(
          "/me?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,companyName,officeLocation",
          req.graphToken
        );

      return res.json({
        success: true,

        connected: true,

        data,

        user:
          data,

        profile:
          data,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Outlook Profile]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected: false,

        message:
          error.message ||
          "Unable to load Microsoft profile.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  };

app.get(
  "/api/outlook/me",
  requireGraphToken,
  outlookProfileHandler
);

app.get(
  "/api/outlook/profile",
  requireGraphToken,
  outlookProfileHandler
);

/* ============================================================================
   OUTLOOK PHOTO
============================================================================ */

app.get(
  "/api/outlook/photo",
  requireGraphToken,
  async (req, res) => {
    try {
      const response =
        await fetch(
          `${GRAPH_BASE_URL}/me/photo/$value`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${req.graphToken}`,
            },
          }
        );

      if (!response.ok) {
        return res.status(
          response.status
        ).json({
          success: false,

          connected:
            response.status !==
            401,

          message:
            "Microsoft profile photo is not available.",

          timestamp:
            new Date().toISOString(),
        });
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) ||
        "image/jpeg";

      const arrayBuffer =
        await response.arrayBuffer();

      const buffer =
        Buffer.from(
          arrayBuffer
        );

      res.setHeader(
        "Content-Type",
        contentType
      );

      res.setHeader(
        "Cache-Control",
        "private, max-age=300"
      );

      return res.send(
        buffer
      );
    } catch (error) {
      console.error(
        "[Outlook Photo]",
        error
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected: false,

        message:
          error.message ||
          "Unable to load Microsoft profile photo.",

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   OUTLOOK INBOX
============================================================================ */

const outlookInboxHandler =
  async (req, res) => {
    try {
      const top =
        normalizeTop(
          req.query.top,
          100,
          100
        );

      const startDate =
        String(
          req.query.startDate ||
            ""
        ).trim();

      const endDate =
        String(
          req.query.endDate ||
            ""
        ).trim();

      let safeStartDate =
        null;

      let safeEndDate =
        null;

      if (
        startDate ||
        endDate
      ) {
        if (
          !isValidDateString(
            startDate
          ) ||
          !isValidDateString(
            endDate
          )
        ) {
          return res.status(400).json({
            success: false,

            connected: true,

            message:
              "startDate and endDate must use YYYY-MM-DD format.",

            emails: [],

            value: [],

            messages: [],
          });
        }

        safeStartDate =
          startDate;

        safeEndDate =
          endDate;
      }

      const endpoint =
        buildInboxEndpoint({
          top,

          startDate:
            safeStartDate,

          endDate:
            safeEndDate,
        });

      const data =
        await graphRequest(
          endpoint,
          req.graphToken
        );

      return res.json(
        formatOutlookMessagesResponse({
          data,

          folder:
            "Inbox",
        })
      );
    } catch (error) {
      console.error(
        "[Outlook Inbox]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        count: 0,

        emails: [],

        value: [],

        messages: [],

        message:
          error.message ||
          "Unable to load Outlook inbox.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  };

app.get(
  "/api/outlook/inbox",
  requireGraphToken,
  outlookInboxHandler
);

app.get(
  "/api/outlook/mail",
  requireGraphToken,
  outlookInboxHandler
);

app.get(
  "/api/outlook/messages",
  requireGraphToken,
  outlookInboxHandler
);

/* ============================================================================
   CALENDAR GET
============================================================================ */

app.get(
  "/api/outlook/calendar",
  requireGraphToken,
  async (req, res) => {
    try {
      let requestedDate =
        String(
          req.query.date ||
            ""
        ).trim();

      if (!requestedDate) {
        requestedDate =
          getTodayIST();
      }

      if (
        !isValidDateString(
          requestedDate
        )
      ) {
        return res.status(400).json({
          success: false,

          connected: true,

          message:
            "Invalid calendar date. Use YYYY-MM-DD.",

          events: [],

          value: [],
        });
      }

      const nextDate =
        addDaysToDateString(
          requestedDate,
          1
        );

      const params =
        new URLSearchParams();

      params.set(
        "startDateTime",
        `${requestedDate}T00:00:00`
      );

      params.set(
        "endDateTime",
        `${nextDate}T00:00:00`
      );

      params.set(
        "$top",
        "100"
      );

      params.set(
        "$orderby",
        "start/dateTime"
      );

      params.set(
        "$select",
        [
          "id",
          "subject",
          "bodyPreview",
          "start",
          "end",
          "location",
          "locations",
          "organizer",
          "attendees",
          "isCancelled",
          "isAllDay",
          "onlineMeeting",
          "onlineMeetingProvider",
          "webLink",
          "showAs",
          "importance",
          "sensitivity",
          "responseStatus",
          "categories",
          "isReminderOn",
          "reminderMinutesBeforeStart",
        ].join(",")
      );

      const endpoint =
        `/me/calendarView?${params.toString()}`;

      console.log(
        `[Outlook Calendar] Loading ${requestedDate} → ${nextDate}`
      );

      const data =
        await graphRequest(
          endpoint,
          req.graphToken,
          {
            headers: {
              Prefer:
                `outlook.timezone="${OUTLOOK_TIME_ZONE}"`,
            },
          }
        );

      const events =
        Array.isArray(
          data?.value
        )
          ? data.value
          : [];

      return res.json({
        success: true,

        connected: true,

        date:
          requestedDate,

        timezone:
          OUTLOOK_TIME_ZONE,

        count:
          events.length,

        events,

        value:
          events,

        nextLink:
          data?.[
            "@odata.nextLink"
          ] || null,

        source: {
          provider:
            "Microsoft Graph",

          endpoint:
            "/me/calendarView",

          type:
            "Outlook Calendar",
        },

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Outlook Calendar]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        date:
          req.query.date ||
          getTodayIST(),

        count: 0,

        events: [],

        value: [],

        message:
          error.message ||
          "Unable to load Outlook calendar.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   GET SINGLE CALENDAR EVENT
============================================================================ */

app.get(
  "/api/outlook/calendar/:eventId",
  requireGraphToken,
  async (req, res) => {
    try {
      const eventId =
        String(
          req.params.eventId ||
            ""
        ).trim();

      if (!eventId) {
        return res.status(400).json({
          success: false,

          message:
            "Event ID is required.",
        });
      }

      const event =
        await graphRequest(
          `/me/events/${encodeURIComponent(
            eventId
          )}`,
          req.graphToken,
          {
            headers: {
              Prefer:
                `outlook.timezone="${OUTLOOK_TIME_ZONE}"`,
            },
          }
        );

      return res.json({
        success: true,

        connected: true,

        event,

        data:
          event,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Calendar Event]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to load calendar event.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   CREATE CALENDAR EVENT
============================================================================ */

app.post(
  "/api/outlook/calendar",
  requireGraphToken,
  async (req, res) => {
    try {
      const {
        subject,
        date,
        startTime,
        endTime,
        location,
        body,
        attendees,
        isAllDay,
        isTeamsMeeting,
      } =
        req.body || {};

      const safeSubject =
        String(
          subject || ""
        ).trim();

      if (!safeSubject) {
        return res.status(400).json({
          success: false,

          message:
            "Event subject is required.",
        });
      }

      if (
        !isValidDateString(
          String(date || "")
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Valid event date is required in YYYY-MM-DD format.",
        });
      }

      const safeStartTime =
        String(
          startTime ||
            "09:00"
        ).trim();

      const safeEndTime =
        String(
          endTime ||
            "10:00"
        ).trim();

      const eventPayload = {
        subject:
          safeSubject,

        body: {
          contentType:
            "HTML",

          content:
            body
              ? String(body)
              : "",
        },

        start: {
          dateTime:
            `${date}T${safeStartTime}:00`,

          timeZone:
            OUTLOOK_TIME_ZONE,
        },

        end: {
          dateTime:
            `${date}T${safeEndTime}:00`,

          timeZone:
            OUTLOOK_TIME_ZONE,
        },

        location: {
          displayName:
            location
              ? String(location)
              : "",
        },

        isAllDay:
          Boolean(isAllDay),

        attendees:
          Array.isArray(attendees)
            ? attendees
                .filter(Boolean)
                .map((email) => {
                  const address =
                    String(email).trim();

                  return {
                    emailAddress: {
                      address,
                    },

                    type:
                      "required",
                  };
                })
                .filter(
                  (item) =>
                    item.emailAddress &&
                    item.emailAddress.address
                )
            : [],
      };

      if (
        isTeamsMeeting
      ) {
        eventPayload.isOnlineMeeting =
          true;

        eventPayload.onlineMeetingProvider =
          "teamsForBusiness";
      }

      const createdEvent =
        await graphRequest(
          "/me/events",
          req.graphToken,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                `outlook.timezone="${OUTLOOK_TIME_ZONE}"`,
            },

            body:
              JSON.stringify(
                eventPayload
              ),
          }
        );

      io.emit(
        "calendar:event-created",
        createdEvent
      );

      return res.status(201).json({
        success: true,

        connected: true,

        message:
          "Calendar event created successfully.",

        event:
          createdEvent,

        data:
          createdEvent,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Calendar Create]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to create calendar event.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   UPDATE CALENDAR EVENT
============================================================================ */

app.patch(
  "/api/outlook/calendar/:eventId",
  requireGraphToken,
  async (req, res) => {
    try {
      const eventId =
        String(
          req.params.eventId ||
            ""
        ).trim();

      if (!eventId) {
        return res.status(400).json({
          success: false,

          message:
            "Event ID is required.",
        });
      }

      const {
        subject,
        date,
        startTime,
        endTime,
        location,
        body,
        attendees,
        isAllDay,
        isTeamsMeeting,
      } =
        req.body || {};

      const updateData = {};

      if (
        subject !==
        undefined
      ) {
        const safeSubject =
          String(
            subject
          ).trim();

        if (safeSubject) {
          updateData.subject =
            safeSubject;
        }
      }

      if (
        body !==
        undefined
      ) {
        updateData.body = {
          contentType:
            "HTML",

          content:
            String(body),
        };
      }

      if (
        date &&
        startTime
      ) {
        if (
          !isValidDateString(
            String(date)
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Invalid event date.",
          });
        }

        updateData.start = {
          dateTime:
            `${date}T${String(
              startTime
            ).trim()}:00`,

          timeZone:
            OUTLOOK_TIME_ZONE,
        };
      }

      if (
        date &&
        endTime
      ) {
        if (
          !isValidDateString(
            String(date)
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Invalid event date.",
          });
        }

        updateData.end = {
          dateTime:
            `${date}T${String(
              endTime
            ).trim()}:00`,

          timeZone:
            OUTLOOK_TIME_ZONE,
        };
      }

      if (
        location !==
        undefined
      ) {
        updateData.location = {
          displayName:
            String(location),
        };
      }

      if (
        isAllDay !==
        undefined
      ) {
        updateData.isAllDay =
          Boolean(isAllDay);
      }

      /*
       * IMPORTANT:
       * This is the corrected attendees block.
       */
      if (
        attendees !==
        undefined
      ) {
        updateData.attendees =
          Array.isArray(attendees)
            ? attendees
                .filter(Boolean)
                .map((email) => {
                  const address =
                    String(email).trim();

                  return {
                    emailAddress: {
                      address,
                    },

                    type:
                      "required",
                  };
                })
                .filter(
                  (item) =>
                    item.emailAddress &&
                    item.emailAddress.address
                )
            : [];
      }

      if (
        isTeamsMeeting !==
        undefined
      ) {
        updateData.isOnlineMeeting =
          Boolean(
            isTeamsMeeting
          );

        if (
          isTeamsMeeting
        ) {
          updateData.onlineMeetingProvider =
            "teamsForBusiness";
        }
      }

      if (
        Object.keys(
          updateData
        ).length ===
        0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No event fields were supplied.",
        });
      }

      const updatedEvent =
        await graphRequest(
          `/me/events/${encodeURIComponent(
            eventId
          )}`,
          req.graphToken,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Prefer:
                `outlook.timezone="${OUTLOOK_TIME_ZONE}"`,
            },

            body:
              JSON.stringify(
                updateData
              ),
          }
        );

      io.emit(
        "calendar:event-updated",
        updatedEvent
      );

      return res.json({
        success: true,

        connected: true,

        message:
          "Calendar event updated successfully.",

        event:
          updatedEvent,

        data:
          updatedEvent,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Calendar Update]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to update calendar event.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   DELETE CALENDAR EVENT
============================================================================ */

app.delete(
  "/api/outlook/calendar/:eventId",
  requireGraphToken,
  async (req, res) => {
    try {
      const eventId =
        String(
          req.params.eventId ||
            ""
        ).trim();

      if (!eventId) {
        return res.status(400).json({
          success: false,

          message:
            "Event ID is required.",
        });
      }

      await graphRequest(
        `/me/events/${encodeURIComponent(
          eventId
        )}`,
        req.graphToken,
        {
          method:
            "DELETE",
        }
      );

      io.emit(
        "calendar:event-deleted",
        {
          id:
            eventId,
        }
      );

      return res.json({
        success: true,

        connected: true,

        message:
          "Calendar event deleted successfully.",

        eventId,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Calendar Delete]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to delete calendar event.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   MICROSOFT TODO LISTS
============================================================================ */

app.get(
  "/api/outlook/task-lists",
  requireGraphToken,
  async (req, res) => {
    try {
      const lists =
        await getAllGraphPages({
          endpoint:
            "/me/todo/lists?$top=100",

          token:
            req.graphToken,

          maxItems:
            100,
        });

      const normalizedLists =
        lists.map(
          (list) => ({
            id:
              list?.id ||
              "",

            displayName:
              list?.displayName ||
              "Tasks",

            wellknownListName:
              list?.wellknownListName ||
              null,

            isOwner:
              list?.isOwner !==
              false,
          })
        );

      return res.json({
        success: true,

        connected: true,

        count:
          normalizedLists.length,

        lists:
          normalizedLists,

        value:
          normalizedLists,

        source: {
          provider:
            "Microsoft Graph",

          endpoint:
            "/me/todo/lists",
        },

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Task Lists]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        count: 0,

        lists: [],

        value: [],

        message:
          error.message ||
          "Unable to load Microsoft To Do lists.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   MICROSOFT TODO TASKS
============================================================================ */

app.get(
  "/api/outlook/tasks",
  requireGraphToken,
  async (req, res) => {
    try {
      const requestedTop =
        Number(
          req.query.top
        ) || 500;

      const maxTasks =
        Math.min(
          Math.max(
            Math.floor(
              requestedTop
            ),
            1
          ),
          5000
        );

      const lists =
        await getAllGraphPages({
          endpoint:
            "/me/todo/lists?$top=100",

          token:
            req.graphToken,

          maxItems:
            100,
        });

      if (
        lists.length ===
        0
      ) {
        return res.json({
          success: true,

          connected: true,

          count: 0,

          tasks: [],

          value: [],

          lists: [],

          today:
            getTodayIST(),

          todayCount: 0,

          completedCount: 0,

          pendingCount: 0,

          source: {
            provider:
              "Microsoft Graph",

            endpoint:
              "/me/todo/lists",
          },

          timestamp:
            new Date().toISOString(),
        });
      }

      const allTasks = [];

      for (
        const list of lists
      ) {
        if (!list?.id) {
          continue;
        }

        try {
          const listTasks =
            await getAllGraphPages({
              endpoint:
                `/me/todo/lists/${encodeURIComponent(
                  list.id
                )}/tasks?$top=100`,

              token:
                req.graphToken,

              maxItems:
                maxTasks,
            });

          for (
            const task of listTasks
          ) {
            allTasks.push(
              normalizeGraphTask({
                task,

                list,
              })
            );

            if (
              allTasks.length >=
              maxTasks
            ) {
              break;
            }
          }
        } catch (listError) {
          console.error(
            `[Tasks] Failed list ${list.displayName}:`,
            listError.graphResponse ||
              listError.message
          );
        }

        if (
          allTasks.length >=
          maxTasks
        ) {
          break;
        }
      }

      allTasks.sort(
        (a, b) => {
          const aTime =
            a?.dueDateTime
              ? new Date(
                  a.dueDateTime
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          const bTime =
            b?.dueDateTime
              ? new Date(
                  b.dueDateTime
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          const safeA =
            Number.isNaN(
              aTime
            )
              ? Number.MAX_SAFE_INTEGER
              : aTime;

          const safeB =
            Number.isNaN(
              bTime
            )
              ? Number.MAX_SAFE_INTEGER
              : bTime;

          return (
            safeA -
            safeB
          );
        }
      );

      let account =
        null;

      try {
        account =
          await graphRequest(
            "/me?$select=id,displayName,mail,userPrincipalName",
            req.graphToken
          );
      } catch (accountError) {
        console.warn(
          "[Tasks] Account lookup failed:",
          accountError.message
        );
      }

      const today =
        getTodayIST();

      const todayTasks =
        allTasks.filter(
          (task) => {
            if (
              !task?.dueDateTime
            ) {
              return false;
            }

            const raw =
              String(
                task.dueDateTime
              );

            return raw.startsWith(
              today
            );
          }
        );

      const completedTasks =
        allTasks.filter(
          (task) =>
            String(
              task?.status ||
                ""
            ).toLowerCase() ===
            "completed"
        );

      const pendingTasks =
        allTasks.filter(
          (task) =>
            String(
              task?.status ||
                ""
            ).toLowerCase() !==
            "completed"
        );

      return res.json({
        success: true,

        connected: true,

        count:
          allTasks.length,

        tasks:
          allTasks,

        value:
          allTasks,

        lists:
          lists.map(
            (list) => ({
              id:
                list?.id ||
                "",

              displayName:
                list?.displayName ||
                "Tasks",

              wellknownListName:
                list?.wellknownListName ||
                null,
            })
          ),

        account,

        today,

        todayCount:
          todayTasks.length,

        completedCount:
          completedTasks.length,

        pendingCount:
          pendingTasks.length,

        source: {
          provider:
            "Microsoft Graph",

          endpoint:
            "/me/todo/lists/*/tasks",

          type:
            "Microsoft To Do",
        },

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Tasks]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        count: 0,

        tasks: [],

        value: [],

        lists: [],

        message:
          error.message ||
          "Unable to load Microsoft To Do tasks.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   CREATE TODO TASK
============================================================================ */

app.post(
  "/api/outlook/tasks",
  requireGraphToken,
  async (req, res) => {
    try {
      const title =
        String(
          req.body?.title ||
            ""
        ).trim();

      if (!title) {
        return res.status(400).json({
          success: false,

          message:
            "Task title is required.",

          code:
            "TASK_TITLE_REQUIRED",
        });
      }

      let listId =
        req.body?.listId ||
        null;

      if (!listId) {
        const lists =
          await getAllGraphPages({
            endpoint:
              "/me/todo/lists?$top=100",

            token:
              req.graphToken,

            maxItems:
              100,
          });

        if (
          lists.length ===
          0
        ) {
          return res.status(404).json({
            success: false,

            connected: true,

            message:
              "No Microsoft To Do list is available for this account.",

            code:
              "TASK_LIST_NOT_FOUND",
          });
        }

        const defaultList =
          lists.find(
            (list) =>
              String(
                list?.displayName ||
                  ""
              ).toLowerCase() ===
              "tasks"
          ) ||
          lists.find(
            (list) =>
              list?.wellknownListName ===
              "defaultList"
          ) ||
          lists[0];

        listId =
          defaultList.id;
      }

      const taskPayload = {
        title,
      };

      const importance =
        normalizeImportance(
          req.body?.importance
        );

      if (importance) {
        taskPayload.importance =
          importance;
      }

      if (
        req.body?.body !==
          undefined &&
        req.body?.body !==
          null
      ) {
        taskPayload.body = {
          content:
            String(
              req.body.body
            ),

          contentType:
            "text",
        };
      }

      const dueDate =
        buildDueDatePayload(
          req.body?.dueDateTime
        );

      if (dueDate) {
        taskPayload.dueDateTime =
          dueDate;
      }

      const createdTask =
        await graphRequest(
          `/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks`,
          req.graphToken,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                taskPayload
              ),
          }
        );

      let taskList =
        null;

      try {
        taskList =
          await graphRequest(
            `/me/todo/lists/${encodeURIComponent(
              listId
            )}`,
            req.graphToken
          );
      } catch (listError) {
        console.warn(
          "[Tasks] List lookup failed:",
          listError.message
        );
      }

      const normalized =
        normalizeGraphTask({
          task:
            createdTask,

          list:
            taskList || {
              id:
                listId,

              displayName:
                "Tasks",
            },
        });

      io.emit(
        "task:created",
        normalized
      );

      return res.status(201).json({
        success: true,

        connected: true,

        task:
          normalized,

        data:
          normalized,

        message:
          "Task created successfully.",

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Create Task]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to create Microsoft To Do task.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   UPDATE TODO TASK
============================================================================ */

app.patch(
  "/api/outlook/tasks/:taskId",
  requireGraphToken,
  async (req, res) => {
    try {
      const taskId =
        String(
          req.params.taskId ||
            ""
        ).trim();

      const listId =
        String(
          req.body?.listId ||
            ""
        ).trim();

      if (!taskId) {
        return res.status(400).json({
          success: false,

          message:
            "Task ID is required.",
        });
      }

      if (!listId) {
        return res.status(400).json({
          success: false,

          message:
            "Task list ID is required.",
        });
      }

      const updatePayload = {};

      if (
        req.body?.status !==
          undefined
      ) {
        const status =
          normalizeTaskStatus(
            req.body.status
          );

        if (status) {
          updatePayload.status =
            status;
        }
      }

      if (
        req.body?.importance !==
          undefined
      ) {
        const importance =
          normalizeImportance(
            req.body.importance
          );

        if (importance) {
          updatePayload.importance =
            importance;
        }
      }

      if (
        req.body?.title !==
          undefined
      ) {
        const title =
          String(
            req.body.title
          ).trim();

        if (title) {
          updatePayload.title =
            title;
        }
      }

      if (
        req.body?.body !==
          undefined
      ) {
        updatePayload.body = {
          content:
            String(
              req.body.body ||
                ""
            ),

          contentType:
            "text",
        };
      }

      if (
        req.body?.dueDateTime !==
          undefined
      ) {
        const dueDate =
          buildDueDatePayload(
            req.body.dueDateTime
          );

        if (dueDate) {
          updatePayload.dueDateTime =
            dueDate;
        } else if (
          req.body.dueDateTime ===
            null ||
          req.body.dueDateTime ===
            ""
        ) {
          updatePayload.dueDateTime =
            null;
        }
      }

      if (
        Object.keys(
          updatePayload
        ).length ===
        0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "No valid task fields were supplied.",
        });
      }

      const updatedTask =
        await graphRequest(
          `/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks/${encodeURIComponent(
            taskId
          )}`,
          req.graphToken,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                updatePayload
              ),
          }
        );

      let taskList =
        null;

      try {
        taskList =
          await graphRequest(
            `/me/todo/lists/${encodeURIComponent(
              listId
            )}`,
            req.graphToken
          );
      } catch (listError) {
        console.warn(
          "[Tasks] List lookup after update failed:",
          listError.message
        );
      }

      const normalized =
        normalizeGraphTask({
          task:
            updatedTask,

          list:
            taskList || {
              id:
                listId,

              displayName:
                "Tasks",
            },
        });

      io.emit(
        "task:updated",
        normalized
      );

      return res.json({
        success: true,

        connected: true,

        task:
          normalized,

        data:
          normalized,

        message:
          "Task updated successfully.",

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Update Task]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to update Microsoft To Do task.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   COMPLETE TODO TASK
============================================================================ */

app.patch(
  "/api/outlook/tasks/:taskId/complete",
  requireGraphToken,
  async (req, res) => {
    try {
      const taskId =
        String(
          req.params.taskId ||
            ""
        ).trim();

      const listId =
        String(
          req.body?.listId ||
            ""
        ).trim();

      if (!taskId) {
        return res.status(400).json({
          success: false,

          message:
            "Task ID is required.",
        });
      }

      if (!listId) {
        return res.status(400).json({
          success: false,

          message:
            "Task list ID is required.",
        });
      }

      const updatedTask =
        await graphRequest(
          `/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks/${encodeURIComponent(
            taskId
          )}`,
          req.graphToken,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status:
                  "completed",
              }),
          }
        );

      let taskList =
        null;

      try {
        taskList =
          await graphRequest(
            `/me/todo/lists/${encodeURIComponent(
              listId
            )}`,
            req.graphToken
          );
      } catch (listError) {
        console.warn(
          "[Tasks] List lookup failed:",
          listError.message
        );
      }

      const normalized =
        normalizeGraphTask({
          task:
            updatedTask,

          list:
            taskList || {
              id:
                listId,

              displayName:
                "Tasks",
            },
        });

      io.emit(
        "task:updated",
        normalized
      );

      io.emit(
        "task:completed",
        normalized
      );

      return res.json({
        success: true,

        connected: true,

        task:
          normalized,

        data:
          normalized,

        message:
          "Task completed successfully.",

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Complete Task]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected:
          error.status !==
          401,

        message:
          error.message ||
          "Unable to complete Microsoft To Do task.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   OUTLOOK HEALTH
============================================================================ */

app.get(
  "/api/outlook/health",
  requireGraphToken,
  async (req, res) => {
    try {
      const me =
        await graphRequest(
          "/me?$select=id,displayName,mail,userPrincipalName",
          req.graphToken
        );

      return res.json({
        success: true,

        connected: true,

        microsoftGraph:
          "connected",

        user:
          me,

        timezone:
          OUTLOOK_TIME_ZONE,

        todayIST:
          getTodayIST(),

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[Outlook Health]",
        error.graphResponse ||
          error.message
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        connected: false,

        microsoftGraph:
          "disconnected",

        message:
          error.message ||
          "Microsoft Graph is disconnected.",

        graphError:
          error.graphResponse ||
          null,

        timestamp:
          new Date().toISOString(),
      });
    }
  }
);

/* ============================================================================
   SOCKET STATUS
============================================================================ */

app.get(
  "/api/socket/status",
  (req, res) => {
    return res.json({
      success: true,

      socketIO: {
        enabled: true,

        connectedClients:
          io.engine?.clientsCount ||
          0,
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ============================================================================
   OPTIONAL ROUTES
============================================================================ */

const loadRoute =
  (
    routePath,
    apiPath,
    routeName
  ) => {
    try {
      const route =
        require(routePath);

      if (
        typeof route !==
        "function"
      ) {
        throw new Error(
          `${routeName} does not export an Express router/function`
        );
      }

      app.use(
        apiPath,
        route
      );

      console.log(
        `[Routes] ${routeName} → ${apiPath}`
      );

      return true;
    } catch (error) {
      console.warn(
        `[Routes] ${routeName} not loaded:`,
        error.message
      );

      return false;
    }
  };

loadRoute(
  "./routes/authRoutes",
  "/api/auth",
  "Auth routes"
);

loadRoute(
  "./routes/emailRoutes",
  "/api/emails",
  "Email routes"
);

loadRoute(
  "./routes/reportRoutes",
  "/api/reports",
  "Report routes"
);

loadRoute(
  "./routes/analyticsRoutes",
  "/api/analytics",
  "Analytics routes"
);

loadRoute(
  "./routes/taskRoutes",
  "/api/tasks",
  "Task routes"
);

loadRoute(
  "./routes/teamRoutes",
  "/api/team",
  "Team routes"
);

/* ============================================================================
   API INFORMATION
============================================================================ */

app.get(
  "/api",
  (req, res) => {
    return res.json({
      success: true,

      name:
        "AI Outlook Management System",

      version:
        SERVER_VERSION,

      environment:
        NODE_ENV,

      graph:
        GRAPH_BASE_URL,

      timezone:
        OUTLOOK_TIME_ZONE,

      todayIST:
        getTodayIST(),

      endpoints: {
        auth:
          "/api/auth",

        outlook:
          "/api/outlook",

        outlookHealth:
          "/api/outlook/health",

        outlookStatus:
          "/api/outlook/status",

        outlookMe:
          "/api/outlook/me",

        outlookProfile:
          "/api/outlook/profile",

        outlookPhoto:
          "/api/outlook/photo",

        outlookInbox:
          "/api/outlook/inbox",

        outlookMail:
          "/api/outlook/mail",

        outlookMessages:
          "/api/outlook/messages",

        outlookCalendar:
          "/api/outlook/calendar",

        calendarEvent:
          "/api/outlook/calendar/:eventId",

        taskLists:
          "/api/outlook/task-lists",

        outlookTasks:
          "/api/outlook/tasks",

        outlookTaskCreate:
          "POST /api/outlook/tasks",

        outlookTaskUpdate:
          "PATCH /api/outlook/tasks/:taskId",

        outlookTaskComplete:
          "PATCH /api/outlook/tasks/:taskId/complete",

        emails:
          "/api/emails",

        reports:
          "/api/reports",

        analytics:
          "/api/analytics",

        tasks:
          "/api/tasks",

        team:
          "/api/team",

        socketStatus:
          "/api/socket/status",
      },

      database:
        mongoose.connection.readyState ===
        1
          ? "connected"
          : "disconnected",

      socketClients:
        io.engine?.clientsCount ||
        0,

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ============================================================================
   404
============================================================================ */

app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,

      message:
        "API endpoint not found.",

      path:
        req.originalUrl,

      method:
        req.method,

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ============================================================================
   GLOBAL ERROR HANDLER
============================================================================ */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "[Global Error]",
      error
    );

    const statusCode =
      error.status ||
      error.statusCode ||
      500;

    const response = {
      success: false,

      message:
        error.message ||
        "Internal Server Error",

      timestamp:
        new Date().toISOString(),
    };

    if (
      NODE_ENV !==
      "production"
    ) {
      response.stack =
        error.stack;

      if (
        error.graphResponse
      ) {
        response.graphError =
          error.graphResponse;
      }
    }

    return res
      .status(
        statusCode
      )
      .json(
        response
      );
  }
);

/* ============================================================================
   MONGODB
============================================================================ */

const connectDatabase =
  async () => {
    try {
      console.log(
        "[MongoDB] Connecting..."
      );

      await mongoose.connect(
        MONGODB_URI,
        {
          serverSelectionTimeoutMS:
            10000,
        }
      );

      console.log(
        "[MongoDB] Connected successfully."
      );

      console.log(
        `[MongoDB] Database: ${mongoose.connection.name}`
      );

      return true;
    } catch (error) {
      console.error(
        "[MongoDB] Connection failed:",
        error.message
      );

      return false;
    }
  };

/* ============================================================================
   MONGOOSE EVENTS
============================================================================ */

mongoose.connection.on(
  "connected",
  () => {
    console.log(
      "[MongoDB] Mongoose connected."
    );
  }
);

mongoose.connection.on(
  "error",
  (error) => {
    console.error(
      "[MongoDB] Error:",
      error.message
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.warn(
      "[MongoDB] Disconnected."
    );
  }
);

/* ============================================================================
   START SERVER
============================================================================ */

const startServer =
  async () => {
    try {
      const databaseConnected =
        await connectDatabase();

      const server =
        httpServer.listen(
          PORT,
          () => {
            console.log("");

            console.log(
              "================================================"
            );

            console.log(
              "       AI OUTLOOK MANAGEMENT SYSTEM"
            );

            console.log(
              "================================================"
            );

            console.log(
              `Version      : ${SERVER_VERSION}`
            );

            console.log(
              `Server       : http://localhost:${PORT}`
            );

            console.log(
              `API          : http://localhost:${PORT}/api`
            );

            console.log(
              `Health       : http://localhost:${PORT}/health`
            );

            console.log(
              `Status       : http://localhost:${PORT}/api/outlook/status`
            );

            console.log(
              `Profile      : http://localhost:${PORT}/api/outlook/profile`
            );

            console.log(
              `Photo        : http://localhost:${PORT}/api/outlook/photo`
            );

            console.log(
              `Inbox        : http://localhost:${PORT}/api/outlook/inbox`
            );

            console.log(
              `Calendar     : http://localhost:${PORT}/api/outlook/calendar`
            );

            console.log(
              `Tasks        : http://localhost:${PORT}/api/outlook/tasks`
            );

            console.log(
              `Task Lists   : http://localhost:${PORT}/api/outlook/task-lists`
            );

            console.log(
              `Socket       : http://localhost:${PORT}/api/socket/status`
            );

            console.log(
              `Graph        : ${GRAPH_BASE_URL}`
            );

            console.log(
              `Timezone     : ${OUTLOOK_TIME_ZONE}`
            );

            console.log(
              `Today IST    : ${getTodayIST()}`
            );

            console.log(
              `Frontend     : ${FRONTEND_URL}`
            );

            console.log(
              `MongoDB      : ${
                databaseConnected
                  ? "Connected"
                  : "Disconnected"
              }`
            );

            console.log(
              `Environment  : ${NODE_ENV}`
            );

            console.log(
              "================================================"
            );

            console.log(
              "Microsoft Graph Integration : ENABLED"
            );

            console.log(
              "Outlook Profile             : ENABLED"
            );

            console.log(
              "Outlook Photo               : ENABLED"
            );

            console.log(
              "Outlook Inbox               : ENABLED"
            );

            console.log(
              "Inbox Date Filtering        : ENABLED"
            );

            console.log(
              "Outlook Calendar            : ENABLED"
            );

            console.log(
              "Calendar IST Timezone       : ENABLED"
            );

            console.log(
              "Calendar Create             : ENABLED"
            );

            console.log(
              "Calendar Update             : ENABLED"
            );

            console.log(
              "Calendar Delete             : ENABLED"
            );

            console.log(
              "Microsoft To Do             : ENABLED"
            );

            console.log(
              "Task Create                 : ENABLED"
            );

            console.log(
              "Task Update                 : ENABLED"
            );

            console.log(
              "Task Complete               : ENABLED"
            );

            console.log(
              "Socket.IO                   : ENABLED"
            );

            console.log(
              "================================================"
            );

            console.log("");
          }
        );

      /* ======================================================================
         GRACEFUL SHUTDOWN
      ====================================================================== */

      const shutdown =
        async (
          signal
        ) => {
          console.log(
            `\n[Server] ${signal} received.`
          );

          console.log(
            "[Server] Shutting down..."
          );

          try {
            io.close();

            console.log(
              "[Socket.IO] Closed."
            );
          } catch (error) {
            console.warn(
              "[Socket.IO]",
              error.message
            );
          }

          server.close(
            async () => {
              console.log(
                "[Server] HTTP server closed."
              );

              try {
                if (
                  mongoose
                    .connection
                    .readyState !==
                  0
                ) {
                  await mongoose
                    .connection
                    .close();

                  console.log(
                    "[MongoDB] Connection closed."
                  );
                }

                console.log(
                  "[Server] Shutdown completed."
                );

                process.exit(0);
              } catch (error) {
                console.error(
                  "[Shutdown]",
                  error.message
                );

                process.exit(1);
              }
            }
          );
        };

      process.once(
        "SIGINT",
        () =>
          shutdown(
            "SIGINT"
          )
      );

      process.once(
        "SIGTERM",
        () =>
          shutdown(
            "SIGTERM"
          )
      );
    } catch (error) {
      console.error(
        "[Server] Startup failed:",
        error
      );

      process.exit(1);
    }
  };

/* ============================================================================
   PROCESS ERROR HANDLING
============================================================================ */

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "[Unhandled Promise Rejection]",
      reason
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "[Uncaught Exception]",
      error
    );
  }
);

/* ============================================================================
   START
============================================================================ */

startServer();

/* ============================================================================
   EXPORT
============================================================================ */

module.exports =
  app;
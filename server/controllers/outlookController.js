"use strict";

const axios = require("axios");

const graphService = require("../services/graphService");

const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

/* ============================================================
   GET GRAPH TOKEN
============================================================ */

const getToken = (req) => {
  const token =
    req.graphToken ||
    req.accessToken ||
    req.headers?.authorization?.replace(
      /^Bearer\s+/i,
      ""
    );

  if (!token) {
    const error = new Error(
      "Microsoft Graph access token is required."
    );

    error.status = 401;

    throw error;
  }

  return token.trim();
};

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
  try {
    const response = await axios({
      method,
      url,
      params,
      data,

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...headers,
      },

      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    console.error(
      "[Microsoft Graph Request Error]",
      {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        url,
        method,
      }
    );

    throw error;
  }
};

/* ============================================================
   GRAPH ERROR RESPONSE
============================================================ */

const sendGraphError = (
  res,
  error,
  defaultMessage
) => {
  const status =
    error?.response?.status ||
    error?.status ||
    error?.statusCode ||
    500;

  const graphError =
    error?.response?.data || null;

  const message =
    graphError?.error?.message ||
    error?.message ||
    defaultMessage;

  let code =
    "MICROSOFT_GRAPH_ERROR";

  if (status === 401) {
    code = "GRAPH_AUTH_ERROR";
  }

  if (status === 403) {
    code = "GRAPH_PERMISSION_ERROR";
  }

  if (status === 404) {
    code = "GRAPH_RESOURCE_NOT_FOUND";
  }

  return res.status(status).json({
    success: false,
    message,
    code,
    graphError,
    timestamp:
      new Date().toISOString(),
  });
};

/* ============================================================
   GET INBOX
   GET /outlook/inbox
============================================================ */

const getInbox = async (
  req,
  res
) => {
  try {
    const token = getToken(req);

    const top = Math.min(
      Math.max(
        Number(req.query.top) || 100,
        1
      ),
      1000
    );

    const maxMessages = Math.min(
      Math.max(
        Number(
          req.query.maxMessages
        ) || 1000,
        1
      ),
      5000
    );

    const result =
      await graphService.getInboxEmails(
        token,
        {
          top,
          maxMessages,
        }
      );

    const emails =
      Array.isArray(result?.value)
        ? result.value
        : [];

    const unreadCount =
      emails.filter(
        (email) =>
          email?.isRead === false
      ).length;

    return res.status(200).json({
      success: true,

      data: emails,

      value: emails,

      count: emails.length,

      total: emails.length,

      unreadCount,

      source:
        "Microsoft Graph",

      folder:
        "Inbox",

      fetchedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] getInbox:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to load Outlook inbox."
    );
  }
};

/* ============================================================
   GET ALL MAIL
   GET /outlook/mail
============================================================ */

const getAllMail = async (
  req,
  res
) => {
  try {
    const token = getToken(req);

    const top = Math.min(
      Math.max(
        Number(req.query.top) || 100,
        1
      ),
      1000
    );

    const maxMessages = Math.min(
      Math.max(
        Number(
          req.query.maxMessages
        ) || 1000,
        1
      ),
      5000
    );

    const result =
      await graphService.getOutlookEmails(
        token,
        {
          top,
          maxMessages,
        }
      );

    const emails =
      Array.isArray(result?.value)
        ? result.value
        : [];

    const unreadCount =
      emails.filter(
        (email) =>
          email?.isRead === false
      ).length;

    return res.status(200).json({
      success: true,

      data: emails,

      value: emails,

      count: emails.length,

      total: emails.length,

      unreadCount,

      source:
        "Microsoft Graph",

      fetchedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] getAllMail:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to load Outlook mail."
    );
  }
};

/* ============================================================
   GET PROFILE
   GET /outlook/profile
============================================================ */

const getProfile = async (
  req,
  res
) => {
  try {
    const token = getToken(req);

    const profile =
      await graphService.getUserProfile(
        token
      );

    return res.status(200).json({
      success: true,

      data: profile,

      source:
        "Microsoft Graph",

      connected: true,

      fetchedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] getProfile:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to load Microsoft profile."
    );
  }
};

/* ============================================================
   GET SINGLE MESSAGE
   GET /outlook/messages/:messageId
============================================================ */

const getMessageById =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        messageId,
      } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message:
            "Message ID is required.",
          code:
            "MESSAGE_ID_REQUIRED",
        });
      }

      const message =
        await graphService.getEmailById(
          token,
          messageId
        );

      return res.status(200).json({
        success: true,

        data: message,

        source:
          "Microsoft Graph",

        fetchedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[OutlookController] getMessageById:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to load message."
      );
    }
  };

/* ============================================================
   MARK AS READ
   PATCH /outlook/:messageId/read
============================================================ */

const markAsRead = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      messageId,
    } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message:
          "Message ID is required.",
        code:
          "MESSAGE_ID_REQUIRED",
      });
    }

    const result =
      await graphService.markEmailAsRead(
        token,
        messageId
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Email marked as read.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] markAsRead:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to mark email as read."
    );
  }
};

/* ============================================================
   MARK AS UNREAD
   PATCH /outlook/:messageId/unread
============================================================ */

const markAsUnread = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      messageId,
    } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message:
          "Message ID is required.",
        code:
          "MESSAGE_ID_REQUIRED",
      });
    }

    const result =
      await graphService.markEmailAsUnread(
        token,
        messageId
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Email marked as unread.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] markAsUnread:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to mark email as unread."
    );
  }
};

/* ============================================================
   SEND MAIL
   POST /outlook/send
============================================================ */

const sendMail = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    if (!req.body) {
      return res.status(400).json({
        success: false,
        message:
          "Email data is required.",
      });
    }

    const result =
      await graphService.sendEmail(
        token,
        req.body
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Email sent successfully.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] sendMail:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to send email."
    );
  }
};

/* ============================================================
   REPLY
   POST /outlook/:messageId/reply
============================================================ */

const reply = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      messageId,
    } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message:
          "Message ID is required.",
      });
    }

    const result =
      await graphService.replyToEmail(
        token,
        messageId,
        req.body || {}
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Reply sent successfully.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] reply:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to reply."
    );
  }
};

/* ============================================================
   REPLY ALL
   POST /outlook/:messageId/reply-all
============================================================ */

const replyAll = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      messageId,
    } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message:
          "Message ID is required.",
      });
    }

    if (
      typeof graphService.replyAllToEmail !==
      "function"
    ) {
      return res.status(501).json({
        success: false,

        message:
          "Reply All is not implemented in the current Graph service.",

        code:
          "REPLY_ALL_NOT_IMPLEMENTED",
      });
    }

    const result =
      await graphService.replyAllToEmail(
        token,
        messageId,
        req.body || {}
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Reply All sent successfully.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] replyAll:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to reply all."
    );
  }
};

/* ============================================================
   FORWARD
   POST /outlook/:messageId/forward
============================================================ */

const forward = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      messageId,
    } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message:
          "Message ID is required.",
      });
    }

    if (
      typeof graphService.forwardEmail !==
      "function"
    ) {
      return res.status(501).json({
        success: false,

        message:
          "Forward is not implemented in the current Graph service.",

        code:
          "FORWARD_NOT_IMPLEMENTED",
      });
    }

    const result =
      await graphService.forwardEmail(
        token,
        messageId,
        req.body || {}
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Email forwarded successfully.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] forward:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to forward email."
    );
  }
};

/* ============================================================
   DELETE EMAIL
   DELETE /outlook/:messageId
============================================================ */

const deleteMessage =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        messageId,
      } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message:
            "Message ID is required.",
        });
      }

      if (
        typeof graphService.deleteEmail !==
        "function"
      ) {
        return res.status(501).json({
          success: false,

          message:
            "Delete is not implemented in the current Graph service.",

          code:
            "DELETE_NOT_IMPLEMENTED",
        });
      }

      const result =
        await graphService.deleteEmail(
          token,
          messageId
        );

      return res.status(200).json({
        success: true,

        data: result,

        message:
          "Email deleted successfully.",

        source:
          "Microsoft Graph",
      });
    } catch (error) {
      console.error(
        "[OutlookController] deleteMessage:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to delete email."
      );
    }
  };

/* ============================================================
   ARCHIVE
   PATCH /outlook/:messageId/archive
============================================================ */

const archive = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      messageId,
    } = req.params;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message:
          "Message ID is required.",
      });
    }

    if (
      typeof graphService.archiveEmail !==
      "function"
    ) {
      return res.status(501).json({
        success: false,

        message:
          "Archive is not implemented in the current Graph service.",

        code:
          "ARCHIVE_NOT_IMPLEMENTED",
      });
    }

    const result =
      await graphService.archiveEmail(
        token,
        messageId
      );

    return res.status(200).json({
      success: true,

      data: result,

      message:
        "Email archived successfully.",

      source:
        "Microsoft Graph",
    });
  } catch (error) {
    console.error(
      "[OutlookController] archive:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to archive email."
    );
  }
};

/* ============================================================
   SEARCH
   GET /outlook/search?q=
============================================================ */

const search = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const query = String(
      req.query.q ||
        req.query.search ||
        ""
    ).trim();

    if (!query) {
      return res.status(400).json({
        success: false,

        message:
          "Search query is required.",

        code:
          "SEARCH_QUERY_REQUIRED",
      });
    }

    if (
      typeof graphService.searchEmails !==
      "function"
    ) {
      return res.status(501).json({
        success: false,

        message:
          "Search is not implemented in the current Graph service.",

        code:
          "SEARCH_NOT_IMPLEMENTED",
      });
    }

    const result =
      await graphService.searchEmails(
        token,
        query
      );

    return res.status(200).json({
      success: true,

      data:
        result?.value || [],

      value:
        result?.value || [],

      count:
        result?.value?.length || 0,

      source:
        "Microsoft Graph",

      query,
    });
  } catch (error) {
    console.error(
      "[OutlookController] search:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to search Outlook."
    );
  }
};

/* ============================================================
   SYNC
   GET /outlook/sync
============================================================ */

const sync = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const result =
      await graphService.getInboxEmails(
        token,
        {
          top: 100,
          maxMessages: 1000,
        }
      );

    const emails =
      Array.isArray(result?.value)
        ? result.value
        : [];

    const unreadCount =
      emails.filter(
        (email) =>
          email?.isRead === false
      ).length;

    return res.status(200).json({
      success: true,

      synchronized: true,

      data: emails,

      value: emails,

      count: emails.length,

      total: emails.length,

      unreadCount,

      source:
        "Microsoft Graph",

      synchronizedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] sync:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Outlook synchronization failed."
    );
  }
};

/* ============================================================
   GET TASKS
   GET /outlook/tasks
============================================================ */

const getTasks = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const listsResponse =
      await graphRequest({
        token,
        method: "GET",
        url:
          `${GRAPH_BASE_URL}/me/todo/lists`,
        params: {
          $top: 100,
        },
      });

    const lists =
      listsResponse?.value || [];

    const normalizedLists = [];
    const allTasks = [];

    for (
      const list of lists
    ) {
      if (!list?.id) {
        continue;
      }

      let nextUrl =
        `${GRAPH_BASE_URL}/me/todo/lists/${encodeURIComponent(
          list.id
        )}/tasks`;

      let listTasks = [];

      while (nextUrl) {
        const taskResponse =
          await graphRequest({
            token,
            method: "GET",
            url: nextUrl,
            params:
              nextUrl.includes("?")
                ? undefined
                : {
                    $top: 100,
                  },
          });

        listTasks = [
          ...listTasks,
          ...(taskResponse?.value ||
            []),
        ];

        nextUrl =
          taskResponse?.[
            "@odata.nextLink"
          ] || null;
      }

      normalizedLists.push({
        id: list.id,

        displayName:
          list.displayName ||
          "Tasks",
      });

      listTasks.forEach(
        (task) => {
          allTasks.push({
            ...task,

            listId:
              list.id,

            listName:
              list.displayName ||
              "Tasks",
          });
        }
      );
    }

    return res.status(200).json({
      success: true,

      source:
        "Microsoft Graph",

      connected: true,

      lists:
        normalizedLists,

      tasks:
        allTasks,

      totalTasks:
        allTasks.length,

      fetchedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] getTasks:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to load Outlook Tasks."
    );
  }
};

/* ============================================================
   CREATE TASK
   POST /outlook/tasks
============================================================ */

const createTask = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      listId,
      title,
      body,
      dueDate,
      importance,
      status,
    } = req.body || {};

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Task title is required.",
        code:
          "TASK_TITLE_REQUIRED",
      });
    }

    if (!listId) {
      return res.status(400).json({
        success: false,
        message:
          "Task list ID is required.",
        code:
          "TASK_LIST_REQUIRED",
      });
    }

    const taskBody = {
      title:
        title.trim(),

      body: {
        content:
          body || "",

        contentType:
          "text",
      },

      importance:
        importance || "normal",

      status:
        status || "notStarted",
    };

    if (dueDate) {
      taskBody.dueDateTime = {
        dateTime:
          new Date(
            dueDate
          ).toISOString(),

        timeZone:
          "UTC",
      };
    }

    const createdTask =
      await graphRequest({
        token,
        method: "POST",

        url:
          `${GRAPH_BASE_URL}/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks`,

        data:
          taskBody,
      });

    return res.status(201).json({
      success: true,

      source:
        "Microsoft Graph",

      message:
        "Task created successfully.",

      data:
        createdTask,

      task: {
        ...createdTask,
        listId,
      },

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] createTask:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to create Outlook Task."
    );
  }
};

/* ============================================================
   UPDATE TASK
   PATCH /outlook/tasks/:taskId
============================================================ */

const updateTask = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      taskId,
    } = req.params;

    const {
      listId,
      title,
      body,
      dueDate,
      importance,
      status,
    } = req.body || {};

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

    const updateBody = {};

    if (
      typeof title ===
      "string"
    ) {
      updateBody.title =
        title.trim();
    }

    if (
      typeof body ===
      "string"
    ) {
      updateBody.body = {
        content:
          body,

        contentType:
          "text",
      };
    }

    if (importance) {
      updateBody.importance =
        importance;
    }

    if (status) {
      updateBody.status =
        status;
    }

    if (
      dueDate === null ||
      dueDate === ""
    ) {
      updateBody.dueDateTime =
        null;
    } else if (dueDate) {
      updateBody.dueDateTime = {
        dateTime:
          new Date(
            dueDate
          ).toISOString(),

        timeZone:
          "UTC",
      };
    }

    const updatedTask =
      await graphRequest({
        token,
        method: "PATCH",

        url:
          `${GRAPH_BASE_URL}/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks/${encodeURIComponent(
            taskId
          )}`,

        data:
          updateBody,
      });

    return res.status(200).json({
      success: true,

      source:
        "Microsoft Graph",

      message:
        "Task updated successfully.",

      data:
        updatedTask,

      task: {
        ...updatedTask,
        listId,
      },

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] updateTask:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to update Outlook Task."
    );
  }
};

/* ============================================================
   DELETE TASK
   DELETE /outlook/tasks/:taskId
============================================================ */

const deleteTask = async (
  req,
  res
) => {
  try {
    const token =
      getToken(req);

    const {
      taskId,
    } = req.params;

    const {
      listId,
    } = req.body || {};

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

    await graphRequest({
      token,
      method: "DELETE",

      url:
        `${GRAPH_BASE_URL}/me/todo/lists/${encodeURIComponent(
          listId
        )}/tasks/${encodeURIComponent(
          taskId
        )}`,
    });

    return res.status(200).json({
      success: true,

      source:
        "Microsoft Graph",

      message:
        "Task deleted successfully.",

      taskId,

      timestamp:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[OutlookController] deleteTask:",
      error?.response?.data ||
        error
    );

    return sendGraphError(
      res,
      error,
      "Failed to delete Outlook Task."
    );
  }
};

/* ============================================================
   GET CALENDAR EVENTS
   GET /outlook/calendar
============================================================ */

const getCalendarEvents =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const now =
        new Date();

      let startDateTime =
        req.query.startDateTime;

      let endDateTime =
        req.query.endDateTime;

      if (!startDateTime) {
        const start =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        startDateTime =
          start.toISOString();
      }

      if (!endDateTime) {
        const end =
          new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59
          );

        endDateTime =
          end.toISOString();
      }

      const response =
        await graphRequest({
          token,
          method: "GET",

          url:
            `${GRAPH_BASE_URL}/me/calendarView`,

          params: {
            startDateTime,
            endDateTime,

            $top: 100,

            $orderby:
              "start/dateTime",

            $select:
              [
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

      let events =
        response?.value || [];

      let nextUrl =
        response?.[
          "@odata.nextLink"
        ] || null;

      while (nextUrl) {
        const nextResponse =
          await graphRequest({
            token,
            method: "GET",
            url: nextUrl,
          });

        events = [
          ...events,
          ...(nextResponse?.value ||
            []),
        ];

        nextUrl =
          nextResponse?.[
            "@odata.nextLink"
          ] || null;
      }

      return res.status(200).json({
        success: true,

        connected: true,

        source:
          "Microsoft Graph",

        data:
          events,

        events,

        totalEvents:
          events.length,

        range: {
          startDateTime,
          endDateTime,
        },

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[OutlookController] getCalendarEvents:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to load Outlook Calendar."
      );
    }
  };

/* ============================================================
   CREATE CALENDAR EVENT
============================================================ */

const createCalendarEvent =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        subject,
        body,
        start,
        end,
        startDateTime,
        endDateTime,
        timeZone,
        location,
        attendees,
        isAllDay,
      } = req.body || {};

      if (!subject?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Event subject is required.",
        });
      }

      const startValue =
        startDateTime ||
        start;

      const endValue =
        endDateTime ||
        end;

      if (
        !startValue ||
        !endValue
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Event start and end are required.",
        });
      }

      const eventBody = {
        subject:
          subject.trim(),

        body: {
          content:
            body || "",

          contentType:
            "HTML",
        },

        start: {
          dateTime:
            new Date(
              startValue
            ).toISOString(),

          timeZone:
            timeZone || "UTC",
        },

        end: {
          dateTime:
            new Date(
              endValue
            ).toISOString(),

          timeZone:
            timeZone || "UTC",
        },

        isAllDay:
          Boolean(isAllDay),
      };

      if (location) {
        eventBody.location = {
          displayName:
            typeof location ===
            "string"
              ? location
              : location?.displayName ||
                "",
        };
      }

      if (
        Array.isArray(
          attendees
        )
      ) {
        eventBody.attendees =
          attendees.map(
            (attendee) => ({
              emailAddress: {
                address:
                  attendee.email ||
                  attendee.address,

                name:
                  attendee.name ||
                  attendee.email ||
                  attendee.address,
              },

              type:
                attendee.type ||
                "required",
            })
          );
      }

      const createdEvent =
        await graphRequest({
          token,
          method: "POST",

          url:
            `${GRAPH_BASE_URL}/me/events`,

          data:
            eventBody,
        });

      return res.status(201).json({
        success: true,

        source:
          "Microsoft Graph",

        message:
          "Calendar event created successfully.",

        data:
          createdEvent,

        event:
          createdEvent,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[OutlookController] createCalendarEvent:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to create Outlook Calendar event."
      );
    }
  };

/* ============================================================
   UPDATE CALENDAR EVENT
============================================================ */

const updateCalendarEvent =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        eventId,
      } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message:
            "Event ID is required.",
        });
      }

      const {
        subject,
        body,
        start,
        end,
        startDateTime,
        endDateTime,
        timeZone,
        location,
        attendees,
        isAllDay,
      } = req.body || {};

      const updateBody = {};

      if (
        typeof subject ===
        "string"
      ) {
        updateBody.subject =
          subject.trim();
      }

      if (
        typeof body ===
        "string"
      ) {
        updateBody.body = {
          content:
            body,

          contentType:
            "HTML",
        };
      }

      const startValue =
        startDateTime ||
        start;

      const endValue =
        endDateTime ||
        end;

      if (startValue) {
        updateBody.start = {
          dateTime:
            new Date(
              startValue
            ).toISOString(),

          timeZone:
            timeZone || "UTC",
        };
      }

      if (endValue) {
        updateBody.end = {
          dateTime:
            new Date(
              endValue
            ).toISOString(),

          timeZone:
            timeZone || "UTC",
        };
      }

      if (
        typeof isAllDay ===
        "boolean"
      ) {
        updateBody.isAllDay =
          isAllDay;
      }

      if (
        location !==
        undefined
      ) {
        updateBody.location = {
          displayName:
            typeof location ===
            "string"
              ? location
              : location?.displayName ||
                "",
        };
      }

      if (
        Array.isArray(
          attendees
        )
      ) {
        updateBody.attendees =
          attendees.map(
            (attendee) => ({
              emailAddress: {
                address:
                  attendee.email ||
                  attendee.address,

                name:
                  attendee.name ||
                  attendee.email ||
                  attendee.address,
              },

              type:
                attendee.type ||
                "required",
            })
          );
      }

      const updatedEvent =
        await graphRequest({
          token,
          method: "PATCH",

          url:
            `${GRAPH_BASE_URL}/me/events/${encodeURIComponent(
              eventId
            )}`,

          data:
            updateBody,
        });

      return res.status(200).json({
        success: true,

        source:
          "Microsoft Graph",

        message:
          "Calendar event updated successfully.",

        data:
          updatedEvent,

        event:
          updatedEvent,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[OutlookController] updateCalendarEvent:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to update Outlook Calendar event."
      );
    }
  };

/* ============================================================
   DELETE CALENDAR EVENT
============================================================ */

const deleteCalendarEvent =
  async (
    req,
    res
  ) => {
    try {
      const token =
        getToken(req);

      const {
        eventId,
      } = req.params;

      if (!eventId) {
        return res.status(400).json({
          success: false,
          message:
            "Event ID is required.",
        });
      }

      await graphRequest({
        token,
        method: "DELETE",

        url:
          `${GRAPH_BASE_URL}/me/events/${encodeURIComponent(
            eventId
          )}`,
      });

      return res.status(200).json({
        success: true,

        source:
          "Microsoft Graph",

        message:
          "Calendar event deleted successfully.",

        eventId,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "[OutlookController] deleteCalendarEvent:",
        error?.response?.data ||
          error
      );

      return sendGraphError(
        res,
        error,
        "Failed to delete Outlook Calendar event."
      );
    }
  };

/* ============================================================
   EXPORT
============================================================ */

module.exports = {
  getInbox,
  getAllMail,
  getProfile,
  getMessageById,

  markAsRead,
  markAsUnread,

  sendMail,
  reply,
  replyAll,
  forward,

  deleteMessage,
  archive,
  search,
  sync,

  getTasks,
  createTask,
  updateTask,
  deleteTask,

  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
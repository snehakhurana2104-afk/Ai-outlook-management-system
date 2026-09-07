// ============================================================
// server/routes/taskRoutes.js
// AI Outlook Intelligence Platform
//
// Microsoft To Do / Outlook Tasks
// Real Microsoft Graph v1.0 Integration
//
// ROUTES:
//
// GET    /api/outlook/tasks
// POST   /api/outlook/tasks
// PATCH  /api/outlook/tasks/:taskId
// DELETE /api/outlook/tasks/:taskId
//
// GET    /api/outlook/task-lists
//
// Microsoft Graph:
// /me/todo/lists
// /me/todo/lists/{listId}/tasks
// ============================================================

"use strict";

const express = require("express");

const router = express.Router();

// ============================================================
// CONFIG
// ============================================================

const GRAPH_BASE_URL =
  process.env.GRAPH_BASE_URL ||
  "https://graph.microsoft.com/v1.0";

// ============================================================
// GRAPH TOKEN MIDDLEWARE
// ============================================================

function requireGraphToken(req, res, next) {
  try {
    const authorization =
      req.headers.authorization || "";

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        connected: false,
        message:
          "Microsoft Graph access token is missing.",
      });
    }

    const token =
      authorization
        .slice("Bearer ".length)
        .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        connected: false,
        message:
          "Microsoft Graph access token is empty.",
      });
    }

    req.graphToken = token;

    next();
  } catch (error) {
    console.error(
      "[TASK ROUTES] Token middleware error:",
      error
    );

    return res.status(401).json({
      success: false,
      connected: false,
      message:
        "Unable to validate Microsoft authentication.",
    });
  }
}

// ============================================================
// GRAPH REQUEST HELPER
// ============================================================

async function graphRequest(
  endpoint,
  token,
  options = {}
) {
  if (!token) {
    throw new Error(
      "Microsoft Graph token is required."
    );
  }

  const requestUrl =
    endpoint.startsWith("http://") ||
    endpoint.startsWith("https://")
      ? endpoint
      : `${GRAPH_BASE_URL}${
          endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`
        }`;

  const method =
    options.method || "GET";

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    ...(options.headers || {}),
  };

  if (
    options.body !== undefined &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] =
      "application/json";
  }

  const response =
    await fetch(requestUrl, {
      method,
      headers,
      body:
        options.body !== undefined
          ? typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body)
          : undefined,
    });

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data = null;

  if (
    contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    data = await response.json();
  } else {
    const text =
      await response.text();

    data = text
      ? {
          message: text,
        }
      : null;
  }

  if (!response.ok) {
    const graphMessage =
      data?.error?.message ||
      data?.message ||
      `Microsoft Graph request failed with status ${response.status}.`;

    const error =
      new Error(graphMessage);

    error.status =
      response.status;

    error.graphError =
      data?.error || null;

    error.graphResponse =
      data;

    throw error;
  }

  return data;
}

// ============================================================
// GRAPH PAGINATION
// ============================================================

async function getAllGraphPages(
  endpoint,
  token,
  maxItems = 5000
) {
  const items = [];

  let nextUrl = endpoint;

  while (
    nextUrl &&
    items.length < maxItems
  ) {
    const data =
      await graphRequest(
        nextUrl,
        token
      );

    const pageItems =
      Array.isArray(
        data?.value
      )
        ? data.value
        : [];

    items.push(
      ...pageItems
    );

    nextUrl =
      data?.["@odata.nextLink"] ||
      null;

    if (
      pageItems.length === 0
    ) {
      break;
    }
  }

  return items.slice(
    0,
    maxItems
  );
}

// ============================================================
// SAFE TOP
// ============================================================

function normalizeTop(value) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    return 100;
  }

  return Math.min(
    Math.max(
      Math.floor(parsed),
      1
    ),
    100
  );
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildQuery(params) {
  const query =
    new URLSearchParams(
      params
    );

  return `?${query.toString()}`;
}

// ============================================================
// TASK FIELDS
// ============================================================

const TASK_SELECT_FIELDS = [
  "id",
  "title",
  "status",
  "importance",
  "createdDateTime",
  "lastModifiedDateTime",
  "dueDateTime",
  "completedDateTime",
  "body",
  "categories",
  "isReminderOn",
  "reminderDateTime",
  "recurrence",
  "webUrl",
].join(",");

// ============================================================
// NORMALIZE TASK
// ============================================================

function normalizeTask(
  task,
  list
) {
  const bodyContent =
    task?.body?.content || "";

  return {
    id:
      task?.id || "",

    taskId:
      task?.id || "",

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
      list?.id || "",

    listName:
      list?.displayName ||
      "Tasks",

    list: list
      ? {
          id: list.id,
          displayName:
            list.displayName,
          wellknownListName:
            list.wellknownListName ||
            null,
        }
      : null,

    body:
      task?.body || null,

    bodyPreview:
      bodyContent,

    dueDateTime:
      task?.dueDateTime ||
      null,

    completedDateTime:
      task?.completedDateTime ||
      null,

    createdDateTime:
      task?.createdDateTime ||
      null,

    lastModifiedDateTime:
      task?.lastModifiedDateTime ||
      null,

    categories:
      Array.isArray(
        task?.categories
      )
        ? task.categories
        : [],

    isReminderOn:
      Boolean(
        task?.isReminderOn
      ),

    reminderDateTime:
      task?.reminderDateTime ||
      null,

    recurrence:
      task?.recurrence ||
      null,

    webLink:
      task?.webUrl ||
      null,

    webUrl:
      task?.webUrl ||
      null,

    raw:
      task,
  };
}

// ============================================================
// FIND DEFAULT LIST
// ============================================================

function findDefaultList(
  lists
) {
  if (
    !Array.isArray(lists) ||
    lists.length === 0
  ) {
    return null;
  }

  // Microsoft Graph exposes the built-in
  // Tasks list using wellknownListName = defaultList.
  const defaultList =
    lists.find(
      (list) =>
        list?.wellknownListName ===
        "defaultList"
    );

  if (defaultList) {
    return defaultList;
  }

  // Fallback by display name
  const preferred =
    [
      "tasks",
      "my tasks",
    ];

  for (
    const name of preferred
  ) {
    const found =
      lists.find(
        (list) =>
          String(
            list?.displayName || ""
          )
            .trim()
            .toLowerCase() ===
          name
      );

    if (found) {
      return found;
    }
  }

  return lists[0];
}

// ============================================================
// HEALTH / DEBUG ROUTE
// ============================================================
//
// GET /api/outlook/tasks/health
//
// This helps verify that the router is mounted.
//
// ============================================================

router.get(
  "/tasks/health",
  (req, res) => {
    return res.json({
      success: true,
      message:
        "Microsoft To Do task routes are working.",
      route:
        "/api/outlook/tasks",
      graph:
        GRAPH_BASE_URL,
    });
  }
);

// ============================================================
// GET TASK LISTS
// ============================================================
//
// GET /api/outlook/task-lists
//
// ============================================================

router.get(
  "/task-lists",
  requireGraphToken,
  async (req, res) => {
    try {
      const token =
        req.graphToken;

      const lists =
        await getAllGraphPages(
          "/me/todo/lists?$top=100",
          token,
          100
        );

      return res.json({
        success: true,
        connected: true,
        count:
          lists.length,
        lists,
        value:
          lists,
        source:
          "Microsoft Graph / Microsoft To Do",
      });
    } catch (error) {
      console.error(
        "[TASK ROUTES] GET task-lists:",
        error
      );

      return res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          connected:
            error.status !== 401,
          message:
            error.message ||
            "Unable to load Microsoft To Do lists.",
          error:
            error.graphError ||
            null,
        });
    }
  }
);

// ============================================================
// GET TASKS
// ============================================================
//
// GET /api/outlook/tasks
//
// Query:
// top=100
// listId=<optional>
// includeCompleted=true|false
//
// ============================================================

router.get(
  "/tasks",
  requireGraphToken,
  async (req, res) => {
    try {
      const token =
        req.graphToken;

      const top =
        normalizeTop(
          req.query.top
        );

      const requestedListId =
        String(
          req.query.listId || ""
        ).trim();

      const includeCompleted =
        String(
          req.query.includeCompleted ??
            "true"
        ).toLowerCase() !==
        "false";

      // --------------------------------------------------------
      // GET ALL LISTS
      // --------------------------------------------------------

      const lists =
        await getAllGraphPages(
          "/me/todo/lists?$top=100",
          token,
          100
        );

      // --------------------------------------------------------
      // CHECK LISTS
      // --------------------------------------------------------

      if (
        !Array.isArray(lists) ||
        lists.length === 0
      ) {
        return res.json({
          success: true,
          connected: true,
          count: 0,
          tasks: [],
          value: [],
          lists: [],
          listCount: 0,
          source:
            "Microsoft Graph / Microsoft To Do",
          message:
            "No Microsoft To Do lists were found.",
        });
      }

      // --------------------------------------------------------
      // SELECT LISTS
      // --------------------------------------------------------

      let listsToQuery =
        lists;

      if (
        requestedListId
      ) {
        listsToQuery =
          lists.filter(
            (list) =>
              String(
                list?.id || ""
              ) ===
              requestedListId
          );

        if (
          listsToQuery.length === 0
        ) {
          return res.status(404).json({
            success: false,
            connected: true,
            message:
              "The requested Microsoft To Do list was not found.",
          });
        }
      }

      // --------------------------------------------------------
      // LOAD TASKS
      // --------------------------------------------------------

      const allTasks = [];

      for (
        const list of listsToQuery
      ) {
        if (!list?.id) {
          continue;
        }

        const query =
          buildQuery({
            $top:
              String(top),

            $select:
              TASK_SELECT_FIELDS,
          });

        const endpoint =
          `/me/todo/lists/${encodeURIComponent(
            list.id
          )}/tasks${query}`;

        const listTasks =
          await getAllGraphPages(
            endpoint,
            token,
            5000
          );

        for (
          const task of listTasks
        ) {
          const status =
            String(
              task?.status || ""
            ).toLowerCase();

          if (
            !includeCompleted &&
            status ===
              "completed"
          ) {
            continue;
          }

          allTasks.push(
            normalizeTask(
              task,
              list
            )
          );
        }
      }

      // --------------------------------------------------------
      // SORT
      // --------------------------------------------------------

      allTasks.sort(
        (a, b) => {
          const aCompleted =
            String(
              a?.status || ""
            ).toLowerCase() ===
            "completed";

          const bCompleted =
            String(
              b?.status || ""
            ).toLowerCase() ===
            "completed";

          if (
            aCompleted !==
            bCompleted
          ) {
            return aCompleted
              ? 1
              : -1;
          }

          const aDue =
            a?.dueDateTime
              ? new Date(
                  a.dueDateTime
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          const bDue =
            b?.dueDateTime
              ? new Date(
                  b.dueDateTime
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          if (
            aDue !== bDue
          ) {
            return (
              aDue - bDue
            );
          }

          return String(
            a?.title || ""
          ).localeCompare(
            String(
              b?.title || ""
            )
          );
        }
      );

      // --------------------------------------------------------
      // RESPONSE
      // --------------------------------------------------------

      return res.json({
        success: true,
        connected: true,

        count:
          allTasks.length,

        tasks:
          allTasks,

        value:
          allTasks,

        lists,

        listCount:
          lists.length,

        source:
          "Microsoft Graph / Microsoft To Do",

        account:
          null,
      });
    } catch (error) {
      console.error(
        "[TASK ROUTES] GET tasks:",
        error
      );

      return res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          connected:
            error.status !== 401,
          message:
            error.message ||
            "Unable to load Microsoft To Do tasks.",
          error:
            error.graphError ||
            null,
        });
    }
  }
);

// ============================================================
// CREATE TASK
// ============================================================
//
// POST /api/outlook/tasks
//
// Body:
//
// {
//   title: "Follow up with client",
//   listId: "...",
//   body: "...",
//   dueDateTime: "...",
//   importance: "normal"
// }
//
// ============================================================

router.post(
  "/tasks",
  requireGraphToken,
  async (req, res) => {
    try {
      const token =
        req.graphToken;

      const {
        title,
        listId,
        body,
        dueDateTime,
        importance,
        isReminderOn,
        reminderDateTime,
      } = req.body || {};

      // --------------------------------------------------------
      // TITLE
      // --------------------------------------------------------

      const cleanTitle =
        String(
          title || ""
        ).trim();

      if (!cleanTitle) {
        return res.status(400).json({
          success: false,
          connected: true,
          message:
            "Task title is required.",
        });
      }

      // --------------------------------------------------------
      // GET LISTS
      // --------------------------------------------------------

      const lists =
        await getAllGraphPages(
          "/me/todo/lists?$top=100",
          token,
          100
        );

      if (
        !lists.length
      ) {
        return res.status(404).json({
          success: false,
          connected: true,
          message:
            "No Microsoft To Do task list is available.",
        });
      }

      // --------------------------------------------------------
      // SELECT LIST
      // --------------------------------------------------------

      let selectedList = null;

      if (listId) {
        selectedList =
          lists.find(
            (list) =>
              String(
                list?.id || ""
              ) ===
              String(listId)
          );

        if (
          !selectedList
        ) {
          return res.status(404).json({
            success: false,
            connected: true,
            message:
              "The selected Microsoft To Do list was not found.",
          });
        }
      } else {
        selectedList =
          findDefaultList(
            lists
          );
      }

      if (
        !selectedList?.id
      ) {
        return res.status(404).json({
          success: false,
          connected: true,
          message:
            "No Microsoft To Do list is available.",
        });
      }

      // --------------------------------------------------------
      // BUILD PAYLOAD
      // --------------------------------------------------------

      const payload = {
        title:
          cleanTitle,

        status:
          "notStarted",

        importance:
          String(
            importance || ""
          ).toLowerCase() ===
          "high"
            ? "high"
            : "normal",
      };

      // --------------------------------------------------------
      // BODY
      // --------------------------------------------------------

      if (
        body !== undefined &&
        body !== null &&
        String(body).trim()
      ) {
        payload.body = {
          content:
            String(body),
          contentType:
            "text",
        };
      }

      // --------------------------------------------------------
      // DUE DATE
      // --------------------------------------------------------

      if (
        dueDateTime
      ) {
        const due =
          new Date(
            dueDateTime
          );

        if (
          Number.isNaN(
            due.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid dueDateTime.",
          });
        }

        payload.dueDateTime = {
          dateTime:
            due.toISOString(),
          timeZone:
            "UTC",
        };
      }

      // --------------------------------------------------------
      // REMINDER
      // --------------------------------------------------------

      if (
        isReminderOn === true &&
        reminderDateTime
      ) {
        const reminder =
          new Date(
            reminderDateTime
          );

        if (
          Number.isNaN(
            reminder.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid reminderDateTime.",
          });
        }

        payload.isReminderOn =
          true;

        payload.reminderDateTime = {
          dateTime:
            reminder.toISOString(),
          timeZone:
            "UTC",
        };
      }

      // --------------------------------------------------------
      // CREATE
      // --------------------------------------------------------

      const created =
        await graphRequest(
          `/me/todo/lists/${encodeURIComponent(
            selectedList.id
          )}/tasks`,
          token,
          {
            method:
              "POST",
            body:
              payload,
          }
        );

      const normalized =
        normalizeTask(
          created,
          selectedList
        );

      return res.status(201).json({
        success: true,
        connected: true,
        message:
          "Microsoft To Do task created successfully.",
        task:
          normalized,
        value:
          normalized,
        list:
          selectedList,
        source:
          "Microsoft Graph / Microsoft To Do",
      });
    } catch (error) {
      console.error(
        "[TASK ROUTES] POST task:",
        error
      );

      return res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          connected:
            error.status !== 401,
          message:
            error.message ||
            "Unable to create Microsoft To Do task.",
          error:
            error.graphError ||
            null,
        });
    }
  }
);

// ============================================================
// UPDATE TASK
// ============================================================
//
// PATCH /api/outlook/tasks/:taskId
//
// Body:
//
// {
//   listId,
//   title,
//   status,
//   importance,
//   body,
//   dueDateTime,
//   isReminderOn,
//   reminderDateTime
// }
//
// ============================================================

router.patch(
  "/tasks/:taskId",
  requireGraphToken,
  async (req, res) => {
    try {
      const token =
        req.graphToken;

      const taskId =
        String(
          req.params.taskId ||
            ""
        ).trim();

      if (!taskId) {
        return res.status(400).json({
          success: false,
          connected: true,
          message:
            "Task ID is required.",
        });
      }

      const {
        listId,
        title,
        status,
        importance,
        body,
        dueDateTime,
        isReminderOn,
        reminderDateTime,
      } = req.body || {};

      if (!listId) {
        return res.status(400).json({
          success: false,
          connected: true,
          message:
            "listId is required to update a Microsoft To Do task.",
        });
      }

      // --------------------------------------------------------
      // PAYLOAD
      // --------------------------------------------------------

      const payload = {};

      // TITLE
      if (
        title !== undefined
      ) {
        const cleanTitle =
          String(
            title
          ).trim();

        if (!cleanTitle) {
          return res.status(400).json({
            success: false,
            message:
              "Task title cannot be empty.",
          });
        }

        payload.title =
          cleanTitle;
      }

      // STATUS
      if (
        status !== undefined
      ) {
        const normalizedStatus =
          String(
            status
          ).trim();

        const allowedStatuses = [
          "notStarted",
          "inProgress",
          "completed",
          "waitingOnOthers",
          "deferred",
        ];

        if (
          !allowedStatuses.includes(
            normalizedStatus
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid task status.",
          });
        }

        payload.status =
          normalizedStatus;
      }

      // IMPORTANCE
      if (
        importance !== undefined
      ) {
        const normalizedImportance =
          String(
            importance
          )
            .trim()
            .toLowerCase();

        if (
          ![
            "normal",
            "high",
          ].includes(
            normalizedImportance
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid task importance.",
          });
        }

        payload.importance =
          normalizedImportance;
      }

      // BODY
      if (
        body !== undefined
      ) {
        payload.body = {
          content:
            String(
              body || ""
            ),
          contentType:
            "text",
        };
      }

      // DUE DATE
      if (
        dueDateTime !==
        undefined
      ) {
        if (
          dueDateTime ===
            null ||
          dueDateTime ===
            ""
        ) {
          payload.dueDateTime =
            null;
        } else {
          const due =
            new Date(
              dueDateTime
            );

          if (
            Number.isNaN(
              due.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid dueDateTime.",
            });
          }

          payload.dueDateTime = {
            dateTime:
              due.toISOString(),
            timeZone:
              "UTC",
          };
        }
      }

      // REMINDER ON/OFF
      if (
        isReminderOn !==
        undefined
      ) {
        payload.isReminderOn =
          Boolean(
            isReminderOn
          );
      }

      // REMINDER DATE
      if (
        reminderDateTime !==
        undefined
      ) {
        if (
          reminderDateTime ===
            null ||
          reminderDateTime ===
            ""
        ) {
          payload.reminderDateTime =
            null;
        } else {
          const reminder =
            new Date(
              reminderDateTime
            );

          if (
            Number.isNaN(
              reminder.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid reminderDateTime.",
            });
          }

          payload.reminderDateTime = {
            dateTime:
              reminder.toISOString(),
            timeZone:
              "UTC",
          };
        }
      }

      // --------------------------------------------------------
      // NOTHING TO UPDATE
      // --------------------------------------------------------

      if (
        Object.keys(
          payload
        ).length === 0
      ) {
        return res.status(400).json({
          success: false,
          connected: true,
          message:
            "No task changes were provided.",
        });
      }

      // --------------------------------------------------------
      // PATCH GRAPH
      // --------------------------------------------------------

      const updated =
        await graphRequest(
          `/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks/${encodeURIComponent(
            taskId
          )}`,
          token,
          {
            method:
              "PATCH",
            body:
              payload,
          }
        );

      // --------------------------------------------------------
      // GET LIST
      // --------------------------------------------------------

      let list = {
        id:
          listId,
        displayName:
          "Tasks",
      };

      try {
        const listData =
          await graphRequest(
            `/me/todo/lists/${encodeURIComponent(
              listId
            )}`,
            token
          );

        if (
          listData
        ) {
          list =
            listData;
        }
      } catch (listError) {
        console.warn(
          "[TASK ROUTES] Could not load list after update:",
          listError.message
        );
      }

      return res.json({
        success: true,
        connected: true,
        message:
          "Microsoft To Do task updated successfully.",
        task:
          normalizeTask(
            updated,
            list
          ),
        value:
          updated,
        source:
          "Microsoft Graph / Microsoft To Do",
      });
    } catch (error) {
      console.error(
        "[TASK ROUTES] PATCH task:",
        error
      );

      return res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          connected:
            error.status !== 401,
          message:
            error.message ||
            "Unable to update Microsoft To Do task.",
          error:
            error.graphError ||
            null,
        });
    }
  }
);

// ============================================================
// DELETE TASK
// ============================================================
//
// DELETE /api/outlook/tasks/:taskId?listId=LIST_ID
//
// ============================================================

router.delete(
  "/tasks/:taskId",
  requireGraphToken,
  async (req, res) => {
    try {
      const token =
        req.graphToken;

      const taskId =
        String(
          req.params.taskId ||
            ""
        ).trim();

      const listId =
        String(
          req.query.listId ||
            req.body?.listId ||
            ""
        ).trim();

      if (!taskId) {
        return res.status(400).json({
          success: false,
          connected: true,
          message:
            "Task ID is required.",
        });
      }

      if (!listId) {
        return res.status(400).json({
          success: false,
          connected: true,
          message:
            "listId is required to delete a Microsoft To Do task.",
        });
      }

      await graphRequest(
        `/me/todo/lists/${encodeURIComponent(
          listId
        )}/tasks/${encodeURIComponent(
          taskId
        )}`,
        token,
        {
          method:
            "DELETE",
        }
      );

      return res.json({
        success: true,
        connected: true,
        message:
          "Microsoft To Do task deleted successfully.",
        taskId,
        listId,
        source:
          "Microsoft Graph / Microsoft To Do",
      });
    } catch (error) {
      console.error(
        "[TASK ROUTES] DELETE task:",
        error
      );

      return res
        .status(
          error.status || 500
        )
        .json({
          success: false,
          connected:
            error.status !== 401,
          message:
            error.message ||
            "Unable to delete Microsoft To Do task.",
          error:
            error.graphError ||
            null,
        });
    }
  }
);

// ============================================================
// ROUTER ERROR HANDLER
// ============================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "[TASK ROUTES] Unhandled error:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      connected: false,
      message:
        "Unexpected Microsoft To Do route error.",
    });
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
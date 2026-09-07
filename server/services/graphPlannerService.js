/******************************************************************************
 * graphPlannerService.js
 *
 * Microsoft Graph To Do / Outlook Tasks Service
 *
 * IMPORTANT:
 * This service uses Microsoft To Do APIs.
 *
 * It does NOT use Microsoft Planner APIs.
 *
 * Microsoft To Do endpoint:
 *   /me/todo/lists
 *   /me/todo/lists/{listId}/tasks
 *
 * AI Outlook Management System
 ******************************************************************************/

const axios = require("axios");

/* ============================================================================
   CONFIGURATION
============================================================================ */

const GRAPH_BASE_URL =
  "https://graph.microsoft.com/v1.0";

const DEFAULT_TIMEOUT =
  Number(process.env.GRAPH_TIMEOUT || 30000);

const MAX_RETRIES =
  Number(process.env.GRAPH_MAX_RETRIES || 3);


/* ============================================================================
   GRAPH TODO SERVICE
============================================================================ */

class GraphPlannerService {

  constructor() {

    this.baseURL =
      GRAPH_BASE_URL;

    this.timeout =
      DEFAULT_TIMEOUT;

    this.maxRetries =
      MAX_RETRIES;

  }


  /* ==========================================================================
     SLEEP
  ========================================================================== */

  sleep(ms) {

    return new Promise((resolve) => {

      setTimeout(resolve, ms);

    });

  }


  /* ==========================================================================
     CREATE AXIOS CLIENT
  ========================================================================== */

  createClient(accessToken) {

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    return axios.create({

      baseURL:
        this.baseURL,

      timeout:
        this.timeout,

      headers: {

        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json",

        Accept:
          "application/json",

      },

    });

  }


  /* ==========================================================================
     RETRY WRAPPER
  ========================================================================== */

  async execute(requestFn) {

    let lastError =
      null;

    for (
      let attempt = 1;
      attempt <= this.maxRetries;
      attempt++
    ) {

      try {

        return await requestFn();

      }

      catch (error) {

        lastError =
          error;

        console.error(
          `[Microsoft Graph To Do Attempt ${attempt}]`,
          error.message
        );

        /*
         * Do not retry authentication/permission errors.
         */

        const status =
          error?.response?.status;

        if (
          status === 400 ||
          status === 401 ||
          status === 403 ||
          status === 404
        ) {

          throw error;

        }

        if (
          attempt <
          this.maxRetries
        ) {

          await this.sleep(
            attempt * 1000
          );

        }

      }

    }

    throw lastError;

  }


  /* ==========================================================================
     PAGINATION HELPER
     
     Microsoft Graph can return @odata.nextLink.
  ========================================================================== */

  async getAllPages(
    client,
    endpoint
  ) {

    const results = [];

    let nextUrl =
      endpoint;

    while (nextUrl) {

      const response =
        await this.execute(
          async () => {

            /*
             * If nextUrl is an absolute Graph URL,
             * Axios can call it directly.
             */

            return client.get(
              nextUrl
            );

          }
        );

      const values =
        Array.isArray(
          response?.data?.value
        )
          ? response.data.value
          : [];

      results.push(
        ...values
      );

      nextUrl =
        response?.data?.["@odata.nextLink"] ||
        null;

    }

    return results;

  }


  /* ==========================================================================
     GET TODO LISTS
     
     GET /me/todo/lists
  ========================================================================== */

  async getTaskLists({
    accessToken,
  }) {

    const client =
      this.createClient(
        accessToken
      );

    try {

      const lists =
        await this.getAllPages(
          client,
          "/me/todo/lists"
        );

      return {

        success:
          true,

        total:
          lists.length,

        lists,

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     GET TASKS FROM ONE TODO LIST
     
     GET /me/todo/lists/{listId}/tasks
  ========================================================================== */

  async getTasks({
    accessToken,
    listId,
  }) {

    if (!listId) {

      throw new Error(
        "Microsoft To Do List Id is required."
      );

    }

    const client =
      this.createClient(
        accessToken
      );

    try {

      const tasks =
        await this.getAllPages(

          client,

          `/me/todo/lists/${encodeURIComponent(
            listId
          )}/tasks`

        );

      return {

        success:
          true,

        total:
          tasks.length,

        tasks,

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     GET ALL TODO TASKS FROM ALL LISTS
     
     This is the MAIN METHOD for your Tasks page.
  ========================================================================== */

  async getAllTasks({
    accessToken,
  }) {

    if (!accessToken) {

      throw new Error(
        "Microsoft Graph access token is required."
      );

    }

    try {

      /*
       * Step 1:
       * Get all Microsoft To Do lists.
       */

      const listResult =
        await this.getTaskLists({

          accessToken,

        });

      if (
        !listResult.success
      ) {

        return listResult;

      }

      const lists =
        listResult.lists || [];


      /*
       * Step 2:
       * Get tasks from every list.
       */

      const taskResults =
        await Promise.all(

          lists.map(
            async (list) => {

              const result =
                await this.getTasks({

                  accessToken,

                  listId:
                    list.id,

                });

              if (
                !result.success
              ) {

                return [];

              }

              /*
               * Add list information to every task.
               */

              return (
                result.tasks || []
              ).map(
                (task) => ({

                  ...task,

                  listId:
                    list.id,

                  listName:
                    list.displayName ||
                    "Tasks",

                })
              );

            }
          )

        );


      /*
       * Flatten arrays.
       */

      const tasks =
        taskResults.flat();


      /*
       * Normalize tasks for frontend.
       */

      const normalizedTasks =
        tasks.map(
          (task) =>
            this.normalizeTask(
              task
            )
        );


      /*
       * Sort:
       *
       * 1. Pending first
       * 2. Due date ascending
       */

      normalizedTasks.sort(
        (a, b) => {

          if (
            a.status !==
            b.status
          ) {

            if (
              a.status ===
              "notStarted"
            ) {

              return -1;

            }

            if (
              b.status ===
              "notStarted"
            ) {

              return 1;

            }

          }

          const dateA =
            a.dueDate
              ? new Date(
                  a.dueDate
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          const dateB =
            b.dueDate
              ? new Date(
                  b.dueDate
                ).getTime()
              : Number.MAX_SAFE_INTEGER;

          return dateA - dateB;

        }
      );


      return {

        success:
          true,

        total:
          normalizedTasks.length,

        lists,

        tasks:
          normalizedTasks,

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     GET PENDING TASKS
     
     status:
       notStarted
       inProgress
  ========================================================================== */

  async getPendingTasks({
    accessToken,
  }) {

    const result =
      await this.getAllTasks({

        accessToken,

      });

    if (
      !result.success
    ) {

      return result;

    }

    const pendingTasks =
      (
        result.tasks || []
      ).filter(
        (task) => {

          return (
            task.status ===
              "notStarted" ||
            task.status ===
              "inProgress"
          );

        }
      );


    return {

      success:
        true,

      total:
        pendingTasks.length,

      tasks:
        pendingTasks,

    };

  }


  /* ==========================================================================
     GET COMPLETED TASKS
  ========================================================================== */

  async getCompletedTasks({
    accessToken,
  }) {

    const result =
      await this.getAllTasks({

        accessToken,

      });

    if (
      !result.success
    ) {

      return result;

    }

    const completedTasks =
      (
        result.tasks || []
      ).filter(
        (task) =>
          task.status ===
          "completed"
      );


    return {

      success:
        true,

      total:
        completedTasks.length,

      tasks:
        completedTasks,

    };

  }


  /* ==========================================================================
     GET OVERDUE TASKS
  ========================================================================== */

  async getOverdueTasks({
    accessToken,
  }) {

    const result =
      await this.getPendingTasks({

        accessToken,

      });

    if (
      !result.success
    ) {

      return result;

    }

    const now =
      new Date();


    const overdueTasks =
      (
        result.tasks || []
      ).filter(
        (task) => {

          if (
            !task.dueDate
          ) {

            return false;

          }

          const dueDate =
            new Date(
              task.dueDate
            );

          return (
            dueDate <
            now
          );

        }
      );


    return {

      success:
        true,

      total:
        overdueTasks.length,

      tasks:
        overdueTasks,

    };

  }


  /* ==========================================================================
     GET TASKS BY DATE RANGE
     
     fromDate:
       YYYY-MM-DD

     toDate:
       YYYY-MM-DD
  ========================================================================== */

  async getTasksByDateRange({
    accessToken,
    fromDate,
    toDate,
  }) {

    const result =
      await this.getAllTasks({

        accessToken,

      });

    if (
      !result.success
    ) {

      return result;

    }

    let tasks =
      result.tasks || [];


    if (fromDate) {

      const start =
        new Date(
          `${fromDate}T00:00:00`
        );

      tasks =
        tasks.filter(
          (task) => {

            if (
              !task.dueDate
            ) {

              return false;

            }

            return (
              new Date(
                task.dueDate
              ) >= start
            );

          }
        );

    }


    if (toDate) {

      const end =
        new Date(
          `${toDate}T23:59:59.999`
        );

      tasks =
        tasks.filter(
          (task) => {

            if (
              !task.dueDate
            ) {

              return false;

            }

            return (
              new Date(
                task.dueDate
              ) <= end
            );

          }
        );

    }


    return {

      success:
        true,

      total:
        tasks.length,

      fromDate:
        fromDate || null,

      toDate:
        toDate || null,

      tasks,

    };

  }


  /* ==========================================================================
     CREATE TODO TASK
     
     POST /me/todo/lists/{listId}/tasks
  ========================================================================== */

  async createTask({
    accessToken,
    listId,
    title,
    body = null,
    dueDate = null,
    importance = "normal",
  }) {

    if (!listId) {

      throw new Error(
        "Microsoft To Do List Id is required."
      );

    }

    if (!title) {

      throw new Error(
        "Task title is required."
      );

    }

    const client =
      this.createClient(
        accessToken
      );


    const payload = {

      title,

      importance,

    };


    if (body) {

      payload.body = {

        content:
          body,

        contentType:
          "text",

      };

    }


    if (dueDate) {

      payload.dueDateTime = {

        dateTime:
          dueDate,

        timeZone:
          "UTC",

      };

    }


    try {

      const response =
        await this.execute(
          async () =>
            client.post(

              `/me/todo/lists/${encodeURIComponent(
                listId
              )}/tasks`,

              payload

            )
        );


      return {

        success:
          true,

        task:
          this.normalizeTask(
            response.data
          ),

        createdAt:
          new Date().toISOString(),

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     UPDATE TODO TASK
     
     PATCH /me/todo/lists/{listId}/tasks/{taskId}
  ========================================================================== */

  async updateTask({
    accessToken,
    listId,
    taskId,
    updates = {},
    etag,
  }) {

    if (!listId) {

      throw new Error(
        "Microsoft To Do List Id is required."
      );

    }

    if (!taskId) {

      throw new Error(
        "Task Id is required."
      );

    }


    const client =
      this.createClient(
        accessToken
      );


    try {

      const config = {

        headers: {

          "Content-Type":
            "application/json",

        },

      };


      if (etag) {

        config.headers[
          "If-Match"
        ] = etag;

      }


      const response =
        await this.execute(
          async () =>
            client.patch(

              `/me/todo/lists/${encodeURIComponent(
                listId
              )}/tasks/${encodeURIComponent(
                taskId
              )}`,

              updates,

              config

            )
        );


      return {

        success:
          true,

        task:
          this.normalizeTask(
            response.data
          ),

        updatedAt:
          new Date().toISOString(),

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     COMPLETE TASK
  ========================================================================== */

  async completeTask({
    accessToken,
    listId,
    taskId,
    etag,
  }) {

    return this.updateTask({

      accessToken,

      listId,

      taskId,

      etag,

      updates: {

        status:
          "completed",

      },

    });

  }


  /* ==========================================================================
     REOPEN TASK
  ========================================================================== */

  async reopenTask({
    accessToken,
    listId,
    taskId,
    etag,
  }) {

    return this.updateTask({

      accessToken,

      listId,

      taskId,

      etag,

      updates: {

        status:
          "notStarted",

      },

    });

  }


  /* ==========================================================================
     DELETE TODO TASK
     
     DELETE /me/todo/lists/{listId}/tasks/{taskId}
  ========================================================================== */

  async deleteTask({
    accessToken,
    listId,
    taskId,
    etag,
  }) {

    if (!listId) {

      throw new Error(
        "Microsoft To Do List Id is required."
      );

    }

    if (!taskId) {

      throw new Error(
        "Task Id is required."
      );

    }


    const client =
      this.createClient(
        accessToken
      );


    try {

      const config = {

        headers: {},

      };


      if (etag) {

        config.headers[
          "If-Match"
        ] = etag;

      }


      await this.execute(
        async () =>
          client.delete(

            `/me/todo/lists/${encodeURIComponent(
              listId
            )}/tasks/${encodeURIComponent(
              taskId
            )}`,

            config

          )
      );


      return {

        success:
          true,

        taskId,

        deletedAt:
          new Date().toISOString(),

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     NORMALIZE TASK
     
     Converts Microsoft Graph task data into a frontend-friendly format.
  ========================================================================== */

  normalizeTask(task) {

    const dueDateTime =
      task?.dueDateTime || null;

    const completedDateTime =
      task?.completedDateTime || null;


    return {

      id:
        task?.id || null,

      title:
        task?.title || "Untitled Task",

      status:
        task?.status || "notStarted",

      importance:
        task?.importance || "normal",

      dueDate:
        dueDateTime?.dateTime || null,

      dueTimeZone:
        dueDateTime?.timeZone || null,

      completedDate:
        completedDateTime?.dateTime || null,

      completedTimeZone:
        completedDateTime?.timeZone || null,

      createdDateTime:
        task?.createdDateTime || null,

      lastModifiedDateTime:
        task?.lastModifiedDateTime || null,

      body:
        task?.body?.content || "",

      bodyType:
        task?.body?.contentType || "text",

      listId:
        task?.listId || null,

      listName:
        task?.listName || "Tasks",

      webUrl:
        task?.webUrl || null,

      etag:
        task?.["@odata.etag"] || null,

      isCompleted:
        task?.status ===
        "completed",

      isPending:
        task?.status ===
          "notStarted" ||
        task?.status ===
          "inProgress",

      isImportant:
        task?.importance ===
        "high",

    };

  }


  /* ==========================================================================
     HEALTH CHECK
  ========================================================================== */

  async healthCheck({
    accessToken,
  }) {

    try {

      const result =
        await this.getTaskLists({

          accessToken,

        });


      if (
        !result.success
      ) {

        return result;

      }


      return {

        success:
          true,

        service:
          "Microsoft Graph To Do Service",

        provider:
          "Microsoft Graph",

        status:
          "Healthy",

        totalLists:
          result.total,

        checkedAt:
          new Date().toISOString(),

      };

    }

    catch (error) {

      return this.mapGraphError(
        error
      );

    }

  }


  /* ==========================================================================
     GRAPH ERROR MAPPING
  ========================================================================== */

  mapGraphError(error) {

    const status =
      error?.response?.status ||
      500;

    const graphError =
      error?.response?.data?.error;


    let message =
      graphError?.message ||
      error?.message ||
      "Microsoft Graph Error";


    if (
      status === 401
    ) {

      message =
        "Microsoft Graph access token is invalid or expired.";

    }


    if (
      status === 403
    ) {

      message =
        "Microsoft To Do permission is not available for this account. Check Tasks.ReadWrite consent in Microsoft Entra ID.";

    }


    if (
      status === 404
    ) {

      message =
        "Microsoft To Do list or task was not found.";

    }


    return {

      success:
        false,

      status,

      code:
        graphError?.code ||
        "GRAPH_ERROR",

      message,

      details:
        graphError || null,

    };

  }


  /* ==========================================================================
     SERVICE INFORMATION
  ========================================================================== */

  getServiceInfo() {

    return {

      provider:
        "Microsoft Graph",

      service:
        "Microsoft To Do",

      version:
        "v1.0",

      endpoint:
        this.baseURL,

      timeout:
        this.timeout,

      retries:
        this.maxRetries,

      scopes: [

        "Tasks.ReadWrite",

      ],

    };

  }

}


/* ============================================================================
   SINGLETON INSTANCE
============================================================================ */

const graphPlannerService =
  new GraphPlannerService();


/* ============================================================================
   INITIALIZATION LOG
============================================================================ */

console.info(
  "[Microsoft Graph] Microsoft To Do Service initialized."
);


/* ============================================================================
   EXPORT
============================================================================ */

module.exports =
  graphPlannerService;


/******************************************************************************
 * END OF FILE
 ******************************************************************************/
/******************************************************************************
 * graphTodoService.js
 * Part 1
 * Microsoft Graph To Do Service
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
   Graph Todo Service
========================================================================== */

class GraphTodoService {

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

          `[Graph Todo Attempt ${attempt}]`,

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
 * graphTodoService.js
 * Part 2
 * Get Task Lists + Get Task List
 *
 * Paste INSIDE GraphTodoService class
 ******************************************************************************/

/* ==========================================================================
   Get All Task Lists
========================================================================== */

async getTaskLists({

  accessToken,

}) {

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          "/me/todo/lists"

        );

      return {

        success: true,

        total:
          response.data.value.length,

        taskLists:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Task List By Id
========================================================================== */

async getTaskList({

  accessToken,

  listId,

}) {

  if (!listId) {

    throw new Error(
      "Task List Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/todo/lists/${listId}`

        );

      return {

        success: true,

        taskList:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphTodoService.js
 * Part 3
 * Get Tasks + Get Task
 *
 * Paste INSIDE GraphTodoService class
 ******************************************************************************/

/* ==========================================================================
   Get Tasks From Task List
========================================================================== */

async getTasks({

  accessToken,

  listId,

}) {

  if (!listId) {

    throw new Error(
      "Task List Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/todo/lists/${listId}/tasks`

        );

      return {

        success: true,

        total:
          response.data.value.length,

        tasks:
          response.data.value,

      };

    }

  );

}

/* ==========================================================================
   Get Single Task
========================================================================== */

async getTask({

  accessToken,

  listId,

  taskId,

}) {

  if (!listId) {

    throw new Error(
      "Task List Id is required."
    );

  }

  if (!taskId) {

    throw new Error(
      "Task Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.get(

          `/me/todo/lists/${listId}/tasks/${taskId}`

        );

      return {

        success: true,

        task:
          response.data,

      };

    }

  );

}
/******************************************************************************
 * graphTodoService.js
 * Part 4
 * Create Task + Update Task
 *
 * Paste INSIDE GraphTodoService class
 ******************************************************************************/

/* ==========================================================================
   Create Task
========================================================================== */

async createTask({

  accessToken,

  listId,

  title,

  body = "",

  dueDateTime = null,

  importance = "normal",

  status = "notStarted",

}) {

  if (!listId) {

    throw new Error(
      "Task List Id is required."
    );

  }

  if (!title) {

    throw new Error(
      "Task title is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const payload = {

        title,

        importance,

        status,

      };

      if (body) {

        payload.body = {

          content: body,

          contentType: "text",

        };

      }

      if (dueDateTime) {

        payload.dueDateTime = {

          dateTime: dueDateTime,

          timeZone: "UTC",

        };

      }

      const response =
        await client.post(

          `/me/todo/lists/${listId}/tasks`,

          payload

        );

      return {

        success: true,

        task: response.data,

        createdAt:
          new Date().toISOString(),

      };

    }

  );

}

/* ==========================================================================
   Update Task
========================================================================== */

async updateTask({

  accessToken,

  listId,

  taskId,

  updates = {},

}) {

  if (!listId) {

    throw new Error(
      "Task List Id is required."
    );

  }

  if (!taskId) {

    throw new Error(
      "Task Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      const response =
        await client.patch(

          `/me/todo/lists/${listId}/tasks/${taskId}`,

          updates

        );

      return {

        success: true,

        taskId,

        task: response.data,

        updatedAt:
          new Date().toISOString(),

      };

    }

  );

}
/******************************************************************************
 * graphTodoService.js
 * Part 5
 * Delete Task + Health Check + Export
 *
 * Paste INSIDE GraphTodoService class
 ******************************************************************************/

/* ==========================================================================
   Delete Task
========================================================================== */

async deleteTask({

  accessToken,

  listId,

  taskId,

}) {

  if (!listId) {

    throw new Error(
      "Task List Id is required."
    );

  }

  if (!taskId) {

    throw new Error(
      "Task Id is required."
    );

  }

  const client =
    this.createClient(accessToken);

  return await this.execute(

    async () => {

      await client.delete(

        `/me/todo/lists/${listId}/tasks/${taskId}`

      );

      return {

        success: true,

        taskId,

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

        "/me/todo/lists"

      );

    return {

      success: true,

      service:
        "Microsoft Graph Todo Service",

      status:
        "Healthy",

      totalTaskLists:
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
      "Todo Service",

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

const graphTodoService =
  new GraphTodoService();

/* ==========================================================================
   Initialization
========================================================================== */

try {

  console.info(

    "[Microsoft Graph] GraphTodoService initialized."

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
  graphTodoService;

/******************************************************************************
 * End graphTodoService.js
 ******************************************************************************/
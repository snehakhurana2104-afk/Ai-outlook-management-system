import axios from "axios";

/* ==========================================================================
   Task API
   Enterprise frontend service for Task Management
========================================================================== */

/* ==========================================================================
   API Configuration
========================================================================== */

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

/* ==========================================================================
   Axios Client
========================================================================== */

const taskApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ==========================================================================
   Request Interceptor
========================================================================== */

taskApiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

/* ==========================================================================
   Response Interceptor
========================================================================== */

taskApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Task API request failed.";

    error.taskApiMessage = message;

    return Promise.reject(error);
  }
);

/* ==========================================================================
   Constants
========================================================================== */

const TASKS_ENDPOINT = "/tasks";

const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

/* ==========================================================================
   Helpers
========================================================================== */

const getTaskId = (task) => {
  if (!task) {
    return null;
  }

  return (
    task.id ??
    task._id ??
    task.taskNumber ??
    task.emailId ??
    null
  );
};

const unwrapTaskResponse = (response) => {
  if (!response) {
    return null;
  }

  return (
    response?.data?.task ??
    response?.task ??
    response?.data ??
    null
  );
};

const unwrapTasksResponse = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.tasks)) {
    return response.tasks;
  }

  if (Array.isArray(response?.data?.tasks)) {
    return response.data.tasks;
  }

  return [];
};

const normalizeTaskPayload = (taskData) => {
  if (!taskData) {
    return {};
  }

  return {
    ...taskData,
  };
};

/* ==========================================================================
   GET ALL TASKS
========================================================================== */

export const getTasks = async (
  params = {}
) => {
  const response =
    await taskApiClient.get(
      TASKS_ENDPOINT,
      {
        params,
      }
    );

  return unwrapTasksResponse(
    response
  );
};

/* ==========================================================================
   GET SINGLE TASK
========================================================================== */

export const getTask = async (
  taskId
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  const response =
    await taskApiClient.get(
      `${TASKS_ENDPOINT}/${encodeURIComponent(
        taskId
      )}`
    );

  return unwrapTaskResponse(
    response
  );
};

/* ==========================================================================
   CREATE TASK
========================================================================== */

export const createTask = async (
  taskData
) => {
  if (!taskData) {
    throw new Error(
      "Task data is required."
    );
  }

  const response =
    await taskApiClient.post(
      TASKS_ENDPOINT,
      normalizeTaskPayload(
        taskData
      )
    );

  return unwrapTaskResponse(
    response
  );
};

/* ==========================================================================
   UPDATE TASK
========================================================================== */

export const updateTask = async (
  taskId,
  taskData
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  if (!taskData) {
    throw new Error(
      "Task data is required."
    );
  }

  const response =
    await taskApiClient.put(
      `${TASKS_ENDPOINT}/${encodeURIComponent(
        taskId
      )}`,
      normalizeTaskPayload(
        taskData
      )
    );

  return unwrapTaskResponse(
    response
  );
};

/* ==========================================================================
   PATCH TASK
========================================================================== */

export const patchTask = async (
  taskId,
  changes
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  if (!changes) {
    throw new Error(
      "Task changes are required."
    );
  }

  const response =
    await taskApiClient.patch(
      `${TASKS_ENDPOINT}/${encodeURIComponent(
        taskId
      )}`,
      normalizeTaskPayload(
        changes
      )
    );

  return unwrapTaskResponse(
    response
  );
};

/* ==========================================================================
   DELETE TASK
========================================================================== */

export const deleteTask = async (
  taskId
) => {
  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  const response =
    await taskApiClient.delete(
      `${TASKS_ENDPOINT}/${encodeURIComponent(
        taskId
      )}`
    );

  return (
    response?.data ?? response
  );
};

/* ==========================================================================
   COMPLETE TASK
========================================================================== */

export const completeTask = async (
  task
) => {
  const taskId =
    getTaskId(task);

  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  return updateTask(
    taskId,
    {
      ...task,
      status:
        TASK_STATUS.COMPLETED,
      completionPercentage: 100,
    }
  );
};

/* ==========================================================================
   REOPEN TASK
========================================================================== */

export const reopenTask = async (
  task
) => {
  const taskId =
    getTaskId(task);

  if (!taskId) {
    throw new Error(
      "Task ID is required."
    );
  }

  return updateTask(
    taskId,
    {
      ...task,
      status:
        TASK_STATUS.PENDING,
      completionPercentage: 0,
    }
  );
};

/* ==========================================================================
   UPDATE TASK STATUS
========================================================================== */

export const updateTaskStatus =
  async (
    taskId,
    status
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!status) {
      throw new Error(
        "Task status is required."
      );
    }

    return patchTask(
      taskId,
      {
        status,
      }
    );
  };

/* ==========================================================================
   UPDATE TASK PRIORITY
========================================================================== */

export const updateTaskPriority =
  async (
    taskId,
    priority
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    if (!priority) {
      throw new Error(
        "Task priority is required."
      );
    }

    return patchTask(
      taskId,
      {
        priority,
      }
    );
  };

/* ==========================================================================
   UPDATE TASK COMPLETION
========================================================================== */

export const updateTaskCompletion =
  async (
    taskId,
    completionPercentage
  ) => {
    if (!taskId) {
      throw new Error(
        "Task ID is required."
      );
    }

    const percentage = Math.min(
      100,
      Math.max(
        0,
        Number(
          completionPercentage
        ) || 0
      )
    );

    const changes = {
      completionPercentage:
        percentage,
    };

    if (percentage === 100) {
      changes.status =
        TASK_STATUS.COMPLETED;
    }

    if (
      percentage < 100
    ) {
      changes.status =
        TASK_STATUS.IN_PROGRESS;
    }

    return patchTask(
      taskId,
      changes
    );
  };

/* ==========================================================================
   SEARCH TASKS
========================================================================== */

export const searchTasks = async (
  search,
  params = {}
) => {
  const response =
    await taskApiClient.get(
      TASKS_ENDPOINT,
      {
        params: {
          ...params,
          search:
            search?.trim() || "",
        },
      }
    );

  return unwrapTasksResponse(
    response
  );
};

/* ==========================================================================
   FILTER TASKS
========================================================================== */

export const filterTasks = async (
  filters = {}
) => {
  const response =
    await taskApiClient.get(
      TASKS_ENDPOINT,
      {
        params: filters,
      }
    );

  return unwrapTasksResponse(
    response
  );
};

/* ==========================================================================
   DEFAULT API OBJECT
========================================================================== */

const taskApi = {
  getTasks,
  getTask,
  createTask,
  updateTask,
  patchTask,
  deleteTask,
  completeTask,
  reopenTask,
  updateTaskStatus,
  updateTaskPriority,
  updateTaskCompletion,
  searchTasks,
  filterTasks,
};

export default taskApi;

/* ==========================================================================
   AI TASK EXTRACTION COMPATIBILITY EXPORT
========================================================================== */

export { extractTasks } from "./aiApi";
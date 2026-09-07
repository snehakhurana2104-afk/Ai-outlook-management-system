import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import TaskList from "./TaskList";
import TaskDetails from "./TaskDetails/TaskDetails";
import CreateTaskForm from "./CreateTaskForm";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./taskApi";

/* ==========================================================================
   Constants
========================================================================== */

const DEFAULT_TASKS = [];

const TASK_MODE = {
  LIST: "list",
  CREATE: "create",
  DETAILS: "details",
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

const extractTaskArray = (response) => {
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

  return DEFAULT_TASKS;
};

const extractCreatedTask = (response) => {
  if (!response) {
    return null;
  }

  if (response?.task) {
    return response.task;
  }

  if (response?.data?.task) {
    return response.data.task;
  }

  if (response?.data && !Array.isArray(response.data)) {
    return response.data;
  }

  return response;
};

const getErrorMessage = (
  error,
  fallback
) => {
  return (
    error?.taskApiMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

/* ==========================================================================
   Task Manager
========================================================================== */

const TaskManager = ({
  className = "",
  autoLoad = true,
}) => {
  /* ==========================================================================
     State
  ========================================================================== */

  const [tasks, setTasks] =
    useState(DEFAULT_TASKS);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [mode, setMode] =
    useState(TASK_MODE.LIST);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /* ==========================================================================
     Refs
  ========================================================================== */

  const mountedRef =
    useRef(true);

  const requestRef =
    useRef(false);

  /* ==========================================================================
     Mounted Guard
  ========================================================================== */

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ==========================================================================
     Load Tasks
  ========================================================================== */

  const loadTasks = useCallback(
    async () => {
      if (requestRef.current) {
        return;
      }

      requestRef.current = true;

      if (mountedRef.current) {
        setLoading(true);
        setError("");
      }

      try {
        const response =
          await getTasks();

        if (!mountedRef.current) {
          return;
        }

        const nextTasks =
          extractTaskArray(response);

        setTasks(nextTasks);

        setSelectedTask(
          (currentTask) => {
            if (!currentTask) {
              return null;
            }

            const currentId =
              getTaskId(currentTask);

            return (
              nextTasks.find(
                (task) =>
                  getTaskId(task) ===
                  currentId
              ) ?? null
            );
          }
        );
      } catch (err) {
        if (!mountedRef.current) {
          return;
        }

        setError(
          getErrorMessage(
            err,
            "Failed to load tasks."
          )
        );
      } finally {
        requestRef.current = false;

        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  /* ==========================================================================
     Initial Load
  ========================================================================== */

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    loadTasks();
  }, [
    autoLoad,
    loadTasks,
  ]);

  /* ==========================================================================
     Select Task
  ========================================================================== */

  const handleSelectTask =
    useCallback(
      (task) => {
        if (!task || loading) {
          return;
        }

        setSelectedTask(task);
        setMode(TASK_MODE.DETAILS);
        setError("");
      },
      [loading]
    );

  /* ==========================================================================
     Back
  ========================================================================== */

  const handleBack =
    useCallback(() => {
      if (loading) {
        return;
      }

      setSelectedTask(null);
      setMode(TASK_MODE.LIST);
      setError("");
    }, [loading]);

  /* ==========================================================================
     Create Task - Open Form
  ========================================================================== */

  const handleOpenCreate =
    useCallback(() => {
      if (loading) {
        return;
      }

      setSelectedTask(null);
      setError("");
      setMode(TASK_MODE.CREATE);
    }, [loading]);

  /* ==========================================================================
     Create Task - API
  ========================================================================== */

  const handleCreateTask =
    useCallback(
      async (taskData) => {
        if (!taskData || loading) {
          return;
        }

        setLoading(true);
        setError("");

        try {
          const response =
            await createTask(
              taskData
            );

          const createdTask =
            extractCreatedTask(
              response
            );

          if (!mountedRef.current) {
            return;
          }

          if (!createdTask) {
            throw new Error(
              "Task was created but no task data was returned."
            );
          }

          const createdTaskId =
            getTaskId(createdTask);

          setTasks(
            (currentTasks) => {
              if (
                createdTaskId &&
                currentTasks.some(
                  (task) =>
                    getTaskId(task) ===
                    createdTaskId
                )
              ) {
                return currentTasks;
              }

              return [
                createdTask,
                ...currentTasks,
              ];
            }
          );

          setSelectedTask(
            createdTask
          );

          setMode(
            TASK_MODE.DETAILS
          );
        } catch (err) {
          if (!mountedRef.current) {
            return;
          }

          setError(
            getErrorMessage(
              err,
              "Failed to create task."
            )
          );
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      },
      [loading]
    );

  /* ==========================================================================
     Cancel Create
  ========================================================================== */

  const handleCancelCreate =
    useCallback(() => {
      if (loading) {
        return;
      }

      setError("");
      setMode(TASK_MODE.LIST);
    }, [loading]);

  /* ==========================================================================
     Update Task
  ========================================================================== */

  const handleUpdateTask =
    useCallback(
      async (task) => {
        if (!task || loading) {
          return;
        }

        const taskId =
          getTaskId(task);

        if (!taskId) {
          setError(
            "Unable to update task: task ID is missing."
          );
          return;
        }

        setLoading(true);
        setError("");

        try {
          const response =
            await updateTask(
              taskId,
              task
            );

          const updatedTask =
            response?.task ??
            response?.data?.task ??
            response?.data ??
            task;

          if (!mountedRef.current) {
            return;
          }

          setTasks(
            (currentTasks) =>
              currentTasks.map(
                (currentTask) =>
                  getTaskId(
                    currentTask
                  ) === taskId
                    ? {
                        ...currentTask,
                        ...updatedTask,
                      }
                    : currentTask
              )
          );

          setSelectedTask(
            (currentTask) => {
              if (
                !currentTask ||
                getTaskId(
                  currentTask
                ) !== taskId
              ) {
                return currentTask;
              }

              return {
                ...currentTask,
                ...updatedTask,
              };
            }
          );

          setMode(
            TASK_MODE.DETAILS
          );
        } catch (err) {
          if (!mountedRef.current) {
            return;
          }

          setError(
            getErrorMessage(
              err,
              "Failed to update task."
            )
          );
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      },
      [loading]
    );

  /* ==========================================================================
     Delete Task
  ========================================================================== */

  const handleDeleteTask =
    useCallback(
      async (task) => {
        if (!task || loading) {
          return;
        }

        const taskId =
          getTaskId(task);

        if (!taskId) {
          setError(
            "Unable to delete task: task ID is missing."
          );
          return;
        }

        setLoading(true);
        setError("");

        try {
          await deleteTask(
            taskId
          );

          if (!mountedRef.current) {
            return;
          }

          setTasks(
            (currentTasks) =>
              currentTasks.filter(
                (currentTask) =>
                  getTaskId(
                    currentTask
                  ) !== taskId
              )
          );

          setSelectedTask(
            (currentTask) =>
              currentTask &&
              getTaskId(
                currentTask
              ) === taskId
                ? null
                : currentTask
          );

          setMode(
            TASK_MODE.LIST
          );
        } catch (err) {
          if (!mountedRef.current) {
            return;
          }

          setError(
            getErrorMessage(
              err,
              "Failed to delete task."
            )
          );
        } finally {
          if (mountedRef.current) {
            setLoading(false);
          }
        }
      },
      [loading]
    );

  /* ==========================================================================
     Retry
  ========================================================================== */

  const handleRetry =
    useCallback(() => {
      if (loading) {
        return;
      }

      loadTasks();
    }, [
      loading,
      loadTasks,
    ]);

  /* ==========================================================================
     Refresh
  ========================================================================== */

  const handleRefresh =
    useCallback(() => {
      if (loading) {
        return;
      }

      loadTasks();
    }, [
      loading,
      loadTasks,
    ]);

  /* ==========================================================================
     Derived State
  ========================================================================== */

  const hasTasks =
    useMemo(
      () =>
        Array.isArray(tasks) &&
        tasks.length > 0,
      [tasks]
    );

  const hasSelectedTask =
    Boolean(selectedTask);

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <section
      className={clsx(
        "flex min-w-0 flex-col",
        "gap-5",
        className
      )}
    >
      {/* ====================================================================
          Error Banner
      ==================================================================== */}

      {error && (
        <div
          className="
            flex
            flex-col
            gap-3
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="min-w-0">
            <p
              className="
                text-sm
                font-semibold
                text-red-800
              "
            >
              Task operation failed
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-red-600
              "
            >
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            disabled={loading}
            className="
              shrink-0
              rounded-lg
              border
              border-red-200
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-red-700
              transition
              hover:bg-red-100
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================================
          Create Mode
      ==================================================================== */}

      {mode === TASK_MODE.CREATE && (
        <CreateTaskForm
          loading={loading}
          onSave={handleCreateTask}
          onCancel={handleCancelCreate}
        />
      )}

      {/* ====================================================================
          List / Details Mode
      ==================================================================== */}

      {mode !== TASK_MODE.CREATE && (
        <div
          className={clsx(
            "grid min-w-0 gap-5",
            hasSelectedTask
              ? "xl:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]"
              : "grid-cols-1"
          )}
        >
          {/* ================================================================
              Task List
          ================================================================ */}

          <TaskList
            tasks={tasks}
            loading={loading}
            onUpdateTask={
              handleUpdateTask
            }
            onDeleteTask={
              handleDeleteTask
            }
            onSelectTask={
              handleSelectTask
            }
            onRefresh={
              handleRefresh
            }
            onCreateTask={
              handleOpenCreate
            }
          />

          {/* ================================================================
              Task Details
          ================================================================ */}

          {hasSelectedTask && (
            <TaskDetails
              task={selectedTask}
              loading={loading}
              onBack={handleBack}
              onUpdateTask={
                handleUpdateTask
              }
              onDeleteTask={
                handleDeleteTask
              }
            />
          )}
        </div>
      )}

      {/* ====================================================================
          Screen Reader Empty State
      ==================================================================== */}

      {!loading &&
        !hasTasks &&
        !error &&
        mode === TASK_MODE.LIST && (
          <div className="sr-only">
            No tasks are currently
            available.
          </div>
        )}
    </section>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskManager.propTypes = {
  className:
    PropTypes.string,

  autoLoad:
    PropTypes.bool,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskManager.defaultProps = {
  className: "",
  autoLoad: true,
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskManager.displayName =
  "TaskManager";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskManager =
  memo(TaskManager);

MemoizedTaskManager.displayName =
  "MemoizedTaskManager";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskManager;
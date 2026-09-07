import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Plus,
  ListTodo,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  X,
} from "lucide-react";

import CreateTask from "./CreateTask";
import TaskList from "./TaskList";
import TaskDetails from "./TaskDetails";

/* ==========================================================================
   Enterprise Constants
========================================================================== */

const DEFAULT_TASKS = [];

const TASK_STATUS = {
  ALL: "all",
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  OVERDUE: "overdue",
};

const TASK_PRIORITY = {
  ALL: "all",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

/* ==========================================================================
   Helpers
========================================================================== */

const getTaskId = (task) => {
  if (!task) return null;

  return (
    task.id ??
    task._id ??
    task.taskNumber ??
    null
  );
};

const isTaskOverdue = (task) => {
  if (!task?.dueDate) return false;

  if (task.status === TASK_STATUS.COMPLETED) {
    return false;
  }

  const dueDate = new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate < new Date();
};

/* ==========================================================================
   AI Task Manager
========================================================================== */

const AITaskManager = ({
  initialTasks = DEFAULT_TASKS,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onRefresh,
  loading = false,
  error = null,
  className = "",
}) => {
  /* ==========================================================================
     State
  ========================================================================== */

  const [tasks, setTasks] = useState(
    Array.isArray(initialTasks)
      ? initialTasks
      : DEFAULT_TASKS
  );

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState(TASK_STATUS.ALL);

  const [priorityFilter, setPriorityFilter] =
    useState(TASK_PRIORITY.ALL);

  /* ==========================================================================
     Sync External Tasks
  ========================================================================== */

  useEffect(() => {
    if (Array.isArray(initialTasks)) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  /* ==========================================================================
     Task Statistics
  ========================================================================== */

  const taskStats = useMemo(() => {
    const total = tasks.length;

    const pending = tasks.filter(
      (task) =>
        task?.status === TASK_STATUS.PENDING
    ).length;

    const inProgress = tasks.filter(
      (task) =>
        task?.status === TASK_STATUS.IN_PROGRESS
    ).length;

    const completed = tasks.filter(
      (task) =>
        task?.status === TASK_STATUS.COMPLETED
    ).length;

    const overdue = tasks.filter(
      isTaskOverdue
    ).length;

    const highPriority = tasks.filter(
      (task) =>
        task?.priority === TASK_PRIORITY.HIGH
    ).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      highPriority,
    };
  }, [tasks]);

  /* ==========================================================================
     Filtered Tasks
  ========================================================================== */

  const filteredTasks = useMemo(() => {
    const search =
      searchQuery.trim().toLowerCase();

    return tasks.filter((task) => {
      if (!task) return false;

      const title =
        task.title?.toLowerCase() || "";

      const description =
        task.description?.toLowerCase() || "";

      const matchesSearch =
        !search ||
        title.includes(search) ||
        description.includes(search);

      const matchesStatus =
        statusFilter === TASK_STATUS.ALL ||
        task.status === statusFilter;

      const matchesPriority =
        priorityFilter === TASK_PRIORITY.ALL ||
        task.priority === priorityFilter;

      const matchesOverdue =
        statusFilter !== TASK_STATUS.OVERDUE ||
        isTaskOverdue(task);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesOverdue
      );
    });
  }, [
    tasks,
    searchQuery,
    statusFilter,
    priorityFilter,
  ]);

  /* ==========================================================================
     Selected Task Validation
  ========================================================================== */

  const selectedTaskExists = useMemo(() => {
    if (!selectedTask) {
      return false;
    }

    const selectedId =
      getTaskId(selectedTask);

    if (!selectedId) {
      return false;
    }

    return tasks.some((task) => {
      const taskId = getTaskId(task);

      return (
        taskId &&
        String(taskId) ===
          String(selectedId)
      );
    });
  }, [selectedTask, tasks]);

  /* ==========================================================================
     Open Create Form
  ========================================================================== */

  const handleOpenCreateForm =
    useCallback(() => {
      setSelectedTask(null);
      setShowCreateForm(true);
    }, []);

  /* ==========================================================================
     Close Create Form
  ========================================================================== */

  const handleCloseCreateForm =
    useCallback(() => {
      setShowCreateForm(false);
    }, []);

  /* ==========================================================================
     Select Task
  ========================================================================== */

  const handleSelectTask =
    useCallback((task) => {
      if (!task) return;

      setShowCreateForm(false);
      setSelectedTask(task);
    }, []);

  /* ==========================================================================
     Back To List
  ========================================================================== */

  const handleBackToList =
    useCallback(() => {
      setSelectedTask(null);
      setShowCreateForm(false);
    }, []);

  /* ==========================================================================
     Create Task
  ========================================================================== */

  const handleCreateTask =
    useCallback(
      async (task) => {
        if (!task) return;

        try {
          let createdTask = task;

          if (onCreateTask) {
            const result =
              await onCreateTask(task);

            if (result) {
              createdTask = result;
            }
          }

          setTasks((currentTasks) => [
            ...currentTasks,
            createdTask,
          ]);

          setShowCreateForm(false);
          setSelectedTask(createdTask);
        } catch (createError) {
          console.error(
            "AI Task Manager - Create failed:",
            createError
          );
        }
      },
      [onCreateTask]
    );

  /* ==========================================================================
     Update Task
  ========================================================================== */

  const handleUpdateTask =
    useCallback(
      async (updatedTask) => {
        if (!updatedTask) return;

        try {
          let finalTask = updatedTask;

          if (onUpdateTask) {
            const result =
              await onUpdateTask(updatedTask);

            if (result) {
              finalTask = result;
            }
          }

          const updatedId =
            getTaskId(finalTask);

          setTasks((currentTasks) =>
            currentTasks.map((task) => {
              const taskId =
                getTaskId(task);

              if (
                taskId &&
                updatedId &&
                String(taskId) ===
                  String(updatedId)
              ) {
                return finalTask;
              }

              return task;
            })
          );

          setSelectedTask(finalTask);
        } catch (updateError) {
          console.error(
            "AI Task Manager - Update failed:",
            updateError
          );
        }
      },
      [onUpdateTask]
    );

  /* ==========================================================================
     Delete Task
  ========================================================================== */

  const handleDeleteTask =
    useCallback(
      async (task) => {
        if (!task) return;

        try {
          if (onDeleteTask) {
            await onDeleteTask(task);
          }

          const taskId =
            getTaskId(task);

          setTasks((currentTasks) =>
            currentTasks.filter((item) => {
              const itemId =
                getTaskId(item);

              if (
                !taskId ||
                !itemId
              ) {
                return item !== task;
              }

              return (
                String(itemId) !==
                String(taskId)
              );
            })
          );

          setSelectedTask(null);
          setShowCreateForm(false);
        } catch (deleteError) {
          console.error(
            "AI Task Manager - Delete failed:",
            deleteError
          );
        }
      },
      [onDeleteTask]
    );

  /* ==========================================================================
     Search
  ========================================================================== */

  const handleSearchChange =
    useCallback((event) => {
      setSearchQuery(
        event.target.value
      );
    }, []);

  /* ==========================================================================
     Status Filter
  ========================================================================== */

  const handleStatusFilterChange =
    useCallback((event) => {
      setStatusFilter(
        event.target.value
      );
    }, []);

  /* ==========================================================================
     Priority Filter
  ========================================================================== */

  const handlePriorityFilterChange =
    useCallback((event) => {
      setPriorityFilter(
        event.target.value
      );
    }, []);

  /* ==========================================================================
     Clear Filters
  ========================================================================== */

  const handleClearFilters =
    useCallback(() => {
      setSearchQuery("");
      setStatusFilter(
        TASK_STATUS.ALL
      );
      setPriorityFilter(
        TASK_PRIORITY.ALL
      );
    }, []);

  /* ==========================================================================
     Refresh
  ========================================================================== */

  const handleRefresh =
    useCallback(async () => {
      if (!onRefresh) return;

      try {
        const refreshedTasks =
          await onRefresh();

        if (
          Array.isArray(
            refreshedTasks
          )
        ) {
          setTasks(refreshedTasks);
        }
      } catch (refreshError) {
        console.error(
          "AI Task Manager - Refresh failed:",
          refreshError
        );
      }
    }, [onRefresh]);

  /* ==========================================================================
     Create Form
  ========================================================================== */

  const createForm = useMemo(() => {
    if (!showCreateForm) {
      return null;
    }

    return (
      <CreateTask
        onCreate={handleCreateTask}
        onCancel={handleCloseCreateForm}
        loading={loading}
      />
    );
  }, [
    showCreateForm,
    handleCreateTask,
    handleCloseCreateForm,
    loading,
  ]);

  /* ==========================================================================
     Task Details
  ========================================================================== */

  const taskDetails = useMemo(() => {
    if (!selectedTaskExists) {
      return null;
    }

    return (
      <TaskDetails
        task={selectedTask}
        onBack={handleBackToList}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        loading={loading}
      />
    );
  }, [
    selectedTaskExists,
    selectedTask,
    handleBackToList,
    handleUpdateTask,
    handleDeleteTask,
    loading,
  ]);

  /* ==========================================================================
     Active Filters
  ========================================================================== */

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== TASK_STATUS.ALL ||
    priorityFilter !== TASK_PRIORITY.ALL;

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <section
      className={clsx(
        "flex flex-col gap-6",
        "rounded-2xl",
        "border border-slate-200",
        "bg-slate-50",
        "p-6",
        "shadow-sm",
        className
      )}
    >
      {/* ================================================================
          Header
      ================================================================ */}

      <div
        className="
          flex flex-col gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-11 w-11
              items-center justify-center
              rounded-xl
              bg-blue-100
              text-blue-600
            "
          >
            <ListTodo size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              AI Task Manager
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create, manage and track your tasks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                border border-slate-300
                bg-white
                px-4 py-2.5
                text-sm font-medium
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateForm}
            disabled={loading}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-blue-600
              px-5 py-2.5
              text-sm font-semibold
              text-white
              transition
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Plus size={17} />

            Create Task
          </button>
        </div>
      </div>

      {/* ================================================================
          Error
      ================================================================ */}

      {error && (
        <div
          className="
            flex items-start gap-3
            rounded-xl
            border border-red-200
            bg-red-50
            p-4
            text-red-700
          "
        >
          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="text-sm font-semibold">
              Unable to load tasks
            </p>

            <p className="mt-1 text-xs">
              {typeof error === "string"
                ? error
                : "Something went wrong while loading tasks."}
            </p>
          </div>
        </div>
      )}

      {/* ================================================================
          Statistics
      ================================================================ */}

      <div
        className="
          grid
          grid-cols-2
          gap-4
          md:grid-cols-3
          xl:grid-cols-6
        "
      >
        <StatCard
          label="Total"
          value={taskStats.total}
        />

        <StatCard
          label="Pending"
          value={taskStats.pending}
        />

        <StatCard
          label="In Progress"
          value={taskStats.inProgress}
        />

        <StatCard
          label="Completed"
          value={taskStats.completed}
        />

        <StatCard
          label="Overdue"
          value={taskStats.overdue}
          valueClassName="text-red-600"
        />

        <StatCard
          label="High Priority"
          value={taskStats.highPriority}
          valueClassName="text-orange-600"
        />
      </div>

      {/* ================================================================
          Create Task
      ================================================================ */}

      {showCreateForm && (
        <div className="rounded-xl">
          {createForm}
        </div>
      )}

      {/* ================================================================
          Task Details
      ================================================================ */}

      {!showCreateForm &&
        selectedTaskExists && (
          <div className="rounded-xl">
            {taskDetails}
          </div>
        )}

      {/* ================================================================
          Task List
      ================================================================ */}

      {!showCreateForm &&
        !selectedTaskExists && (
          <>
            {/* Search / Filters */}

            <div
              className="
                rounded-xl
                border border-slate-200
                bg-white
                p-4
              "
            >
              <div
                className="
                  flex flex-col
                  gap-3
                  lg:flex-row
                  lg:items-center
                "
              >
                {/* Search */}

                <div className="relative flex-1">
                  <Search
                    size={17}
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={
                      handleSearchChange
                    }
                    placeholder="Search tasks..."
                    disabled={loading}
                    className="
                      w-full
                      rounded-lg
                      border border-slate-300
                      bg-white
                      py-2.5
                      pl-10
                      pr-4
                      text-sm
                      text-slate-700
                      outline-none
                      transition
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                      disabled:bg-slate-50
                    "
                  />
                </div>

                {/* Status */}

                <div className="flex items-center gap-2">
                  <Filter
                    size={16}
                    className="text-slate-400"
                  />

                  <select
                    value={statusFilter}
                    onChange={
                      handleStatusFilterChange
                    }
                    disabled={loading}
                    className="
                      rounded-lg
                      border border-slate-300
                      bg-white
                      px-3
                      py-2.5
                      text-sm
                      text-slate-700
                      outline-none
                      focus:border-blue-500
                    "
                  >
                    <option value="all">
                      All Status
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="in-progress">
                      In Progress
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="overdue">
                      Overdue
                    </option>
                  </select>
                </div>

                {/* Priority */}

                <select
                  value={priorityFilter}
                  onChange={
                    handlePriorityFilterChange
                  }
                  disabled={loading}
                  className="
                    rounded-lg
                    border border-slate-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                    text-slate-700
                    outline-none
                    focus:border-blue-500
                  "
                >
                  <option value="all">
                    All Priority
                  </option>

                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>
                </select>

                {/* Clear */}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={
                      handleClearFilters
                    }
                    disabled={loading}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      border border-slate-300
                      bg-white
                      px-4 py-2.5
                      text-sm
                      font-medium
                      text-slate-700
                      transition
                      hover:bg-slate-50
                      disabled:opacity-50
                    "
                  >
                    <X size={15} />

                    Clear
                  </button>
                )}
              </div>

              {/* Result Count */}

              <div className="mt-3">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredTasks.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {tasks.length}
                  </span>{" "}
                  tasks
                </p>
              </div>
            </div>

            {/* Task List */}

            <div
              className="
                rounded-xl
                border border-slate-200
                bg-white
                p-5
              "
            >
              <TaskList
                tasks={filteredTasks}
                onCreateTask={
                  handleOpenCreateForm
                }
                onUpdateTask={
                  handleUpdateTask
                }
                onDeleteTask={
                  handleDeleteTask
                }
                onSelectTask={
                  handleSelectTask
                }
                loading={loading}
              />
            </div>
          </>
        )}

      {/* ================================================================
          Loading Indicator
      ================================================================ */}

      {loading && (
        <div
          className="
            pointer-events-none
            flex
            items-center
            justify-center
            rounded-lg
            bg-slate-100/70
            px-4
            py-3
          "
        >
          <div className="flex items-center gap-2">
            <RefreshCw
              size={16}
              className="animate-spin text-blue-600"
            />

            <span className="text-xs font-medium text-slate-600">
              Updating tasks...
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

/* ==========================================================================
   Statistics Card
========================================================================== */

const StatCard = memo(
  ({
    label,
    value,
    valueClassName = "text-slate-900",
  }) => {
    return (
      <div
        className="
          rounded-xl
          border border-slate-200
          bg-white
          p-4
          transition
          hover:shadow-sm
        "
      >
        <span className="text-xs font-medium text-slate-500">
          {label}
        </span>

        <p
          className={clsx(
            "mt-2 text-2xl font-bold",
            valueClassName
          )}
        >
          {value}
        </p>
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

/* ==========================================================================
   PropTypes
========================================================================== */

AITaskManager.propTypes = {
  initialTasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

      _id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

      taskNumber: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

      title: PropTypes.string,

      description: PropTypes.string,

      status: PropTypes.oneOf([
        "pending",
        "in-progress",
        "completed",
        "overdue",
      ]),

      priority: PropTypes.oneOf([
        "low",
        "medium",
        "high",
      ]),

      dueDate: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),

      assignedTo: PropTypes.string,
    })
  ),

  onCreateTask: PropTypes.func,

  onUpdateTask: PropTypes.func,

  onDeleteTask: PropTypes.func,

  onRefresh: PropTypes.func,

  loading: PropTypes.bool,

  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]),

  className: PropTypes.string,
};

/* ==========================================================================
   Display Name
========================================================================== */

AITaskManager.displayName =
  "AITaskManager";

/* ==========================================================================
   Memoized Export
========================================================================== */

export default memo(AITaskManager);
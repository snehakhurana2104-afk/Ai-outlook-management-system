import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import TaskListItem from "./TaskListItem";

/* ==========================================================================
   Enterprise Constants
========================================================================== */

const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

const DEFAULT_TASKS = [];

const ALL_FILTER = "all";

/* ==========================================================================
   Task List
========================================================================== */

const TaskList = ({
  tasks = DEFAULT_TASKS,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
  onRefresh,
  onCreateTask,
  loading = false,
  className = "",
}) => {
  /* ==========================================================================
     Filter State
  ========================================================================== */

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState(ALL_FILTER);

  const [priorityFilter, setPriorityFilter] =
    useState(ALL_FILTER);

  const [assignedToFilter, setAssignedToFilter] =
    useState(ALL_FILTER);

  const [dueDateFilter, setDueDateFilter] =
    useState(ALL_FILTER);

  /* ==========================================================================
     Normalize Tasks
  ========================================================================== */

  const normalizedTasks = useMemo(() => {
    if (!Array.isArray(tasks)) {
      return [];
    }

    return tasks;
  }, [tasks]);

  /* ==========================================================================
     Statistics
  ========================================================================== */

  const taskStats = useMemo(() => {
    const total =
      normalizedTasks.length;

    const pending =
      normalizedTasks.filter(
        (task) =>
          task?.status ===
          TASK_STATUS.PENDING
      ).length;

    const inProgress =
      normalizedTasks.filter(
        (task) =>
          task?.status ===
          TASK_STATUS.IN_PROGRESS
      ).length;

    const completed =
      normalizedTasks.filter(
        (task) =>
          task?.status ===
          TASK_STATUS.COMPLETED
      ).length;

    const overdue =
      normalizedTasks.filter((task) => {
        if (!task) {
          return false;
        }

        if (
          task.status ===
          TASK_STATUS.COMPLETED
        ) {
          return false;
        }

        if (!task.dueDate) {
          return false;
        }

        const dueDate =
          new Date(task.dueDate);

        if (
          Number.isNaN(
            dueDate.getTime()
          )
        ) {
          return false;
        }

        return dueDate < new Date();
      }).length;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
    };
  }, [normalizedTasks]);

  /* ==========================================================================
     Assigned-To Options
  ========================================================================== */

  const assignedToOptions = useMemo(() => {
    const values =
      normalizedTasks
        .map((task) =>
          typeof task?.assignedTo ===
          "string"
            ? task.assignedTo.trim()
            : ""
        )
        .filter(Boolean);

    return [
      ...new Set(values),
    ].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [normalizedTasks]);

  /* ==========================================================================
     Filtered Tasks
  ========================================================================== */

  const filteredTasks = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return normalizedTasks.filter(
      (task) => {
        if (!task) {
          return false;
        }

        /* ================================================================
           Search
        ================================================================ */

        if (normalizedSearch) {
          const searchableText = [
            task.title,
            task.description,
            task.assignedTo,
            task.taskNumber,
            task.emailId,
          ]
            .filter(
              (value) =>
                value !==
                  null &&
                value !==
                  undefined
            )
            .join(" ")
            .toLowerCase();

          if (
            !searchableText.includes(
              normalizedSearch
            )
          ) {
            return false;
          }
        }

        /* ================================================================
           Status
        ================================================================ */

        if (
          statusFilter !== ALL_FILTER &&
          task.status !==
            statusFilter
        ) {
          return false;
        }

        /* ================================================================
           Priority
        ================================================================ */

        if (
          priorityFilter !==
            ALL_FILTER &&
          String(
            task.priority || ""
          ).toLowerCase() !==
            priorityFilter
              .toLowerCase()
        ) {
          return false;
        }

        /* ================================================================
           Assigned To
        ================================================================ */

        if (
          assignedToFilter !==
            ALL_FILTER &&
          String(
            task.assignedTo || ""
          ) !== assignedToFilter
        ) {
          return false;
        }

        /* ================================================================
           Due Date
        ================================================================ */

        if (
          dueDateFilter !==
          ALL_FILTER
        ) {
          if (!task.dueDate) {
            return (
              dueDateFilter ===
              "no-date"
            );
          }

          const dueDate =
            new Date(
              task.dueDate
            );

          if (
            Number.isNaN(
              dueDate.getTime()
            )
          ) {
            return false;
          }

          const now =
            new Date();

          if (
            dueDateFilter ===
            "overdue"
          ) {
            return (
              task.status !==
                TASK_STATUS.COMPLETED &&
              dueDate < now
            );
          }

          if (
            dueDateFilter ===
            "today"
          ) {
            return (
              dueDate.toDateString() ===
              now.toDateString()
            );
          }

          if (
            dueDateFilter ===
            "upcoming"
          ) {
            return (
              dueDate >= now
            );
          }
        }

        return true;
      }
    );
  }, [
    normalizedTasks,
    searchTerm,
    statusFilter,
    priorityFilter,
    assignedToFilter,
    dueDateFilter,
  ]);

  /* ==========================================================================
     Active Filter Detection
  ========================================================================== */

  const hasActiveFilters =
    Boolean(
      searchTerm.trim() ||
        statusFilter !==
          ALL_FILTER ||
        priorityFilter !==
          ALL_FILTER ||
        assignedToFilter !==
          ALL_FILTER ||
        dueDateFilter !==
          ALL_FILTER
    );

  /* ==========================================================================
     Clear Filters
  ========================================================================== */

  const handleClearFilters =
    useCallback(() => {
      setSearchTerm("");
      setStatusFilter(ALL_FILTER);
      setPriorityFilter(ALL_FILTER);
      setAssignedToFilter(ALL_FILTER);
      setDueDateFilter(ALL_FILTER);
    }, []);

  /* ==========================================================================
     Refresh
  ========================================================================== */

  const handleRefresh =
    useCallback(() => {
      if (loading) {
        return;
      }

      onRefresh?.();
    }, [
      loading,
      onRefresh,
    ]);

  /* ==========================================================================
     Create Task
  ========================================================================== */

  const handleCreateTask =
    useCallback(() => {
      if (loading) {
        return;
      }

      onCreateTask?.();
    }, [
      loading,
      onCreateTask,
    ]);

  /* ==========================================================================
     Task Update
  ========================================================================== */

  const handleUpdateTask =
    useCallback(
      (task) => {
        if (!task || loading) {
          return;
        }

        onUpdateTask?.(task);
      },
      [
        loading,
        onUpdateTask,
      ]
    );

  /* ==========================================================================
     Task Delete
  ========================================================================== */

  const handleDeleteTask =
    useCallback(
      (task) => {
        if (!task || loading) {
          return;
        }

        onDeleteTask?.(task);
      },
      [
        loading,
        onDeleteTask,
      ]
    );

  /* ==========================================================================
     Task Select
  ========================================================================== */

  const handleSelectTask =
    useCallback(
      (task) => {
        if (!task || loading) {
          return;
        }

        onSelectTask?.(task);
      },
      [
        loading,
        onSelectTask,
      ]
    );

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <section
      className={clsx(
        "flex min-w-0 flex-col",
        "overflow-hidden",
        "rounded-2xl",
        "border border-slate-200",
        "bg-white",
        "shadow-sm",
        className
      )}
    >
      {/* ====================================================================
          Header
      ==================================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          border-b
          border-slate-200
          px-6
          py-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* Header Identity */}

        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-blue-100
              text-blue-600
            "
          >
            <ListTodo size={20} />
          </div>

          <div>
            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Task List
            </h2>

            <p
              className="
                mt-1
                text-xs
                text-slate-500
              "
            >
              Manage and track assigned tasks
            </p>
          </div>
        </div>

        {/* Header Actions */}

        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          {loading && (
            <span
              className="
                mr-1
                text-xs
                font-medium
                text-blue-600
              "
            >
              Updating...
            </span>
          )}

          {/* Refresh */}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={14}
              className={clsx(
                loading &&
                  "animate-spin"
              )}
            />

            Refresh
          </button>

          {/* Create */}

          <button
            type="button"
            onClick={handleCreateTask}
            disabled={loading}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              bg-blue-600
              px-3
              py-2
              text-xs
              font-semibold
              text-white
              transition
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Plus size={14} />

            New Task
          </button>
        </div>
      </div>

      {/* ====================================================================
          Statistics
      ==================================================================== */}

      <div
        className="
          grid
          grid-cols-2
          gap-3
          px-6
          py-5
          sm:grid-cols-5
        "
      >
        {/* Total */}

        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-slate-500
              "
            >
              Total
            </span>

            <ListTodo
              size={16}
              className="text-blue-600"
            />
          </div>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-slate-900
            "
          >
            {taskStats.total}
          </p>
        </div>

        {/* Pending */}

        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-slate-500
              "
            >
              Pending
            </span>

            <Clock3
              size={16}
              className="text-amber-500"
            />
          </div>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-slate-900
            "
          >
            {taskStats.pending}
          </p>
        </div>

        {/* In Progress */}

        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-slate-500
              "
            >
              In Progress
            </span>

            <Clock3
              size={16}
              className="text-blue-500"
            />
          </div>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-slate-900
            "
          >
            {taskStats.inProgress}
          </p>
        </div>

        {/* Completed */}

        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-slate-500
              "
            >
              Completed
            </span>

            <CheckCircle2
              size={16}
              className="text-green-600"
            />
          </div>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-slate-900
            "
          >
            {taskStats.completed}
          </p>
        </div>

        {/* Overdue */}

        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-xs
                font-medium
                text-slate-500
              "
            >
              Overdue
            </span>

            <AlertCircle
              size={16}
              className="text-red-600"
            />
          </div>

          <p
            className="
              mt-2
              text-xl
              font-bold
              text-slate-900
            "
          >
            {taskStats.overdue}
          </p>
        </div>
      </div>

      {/* ====================================================================
          Search & Filters
      ==================================================================== */}

      <div
        className="
          border-y
          border-slate-200
          bg-slate-50/70
          px-6
          py-4
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            lg:flex-row
            lg:items-center
          "
        >
          {/* Search */}

          <div
            className="
              relative
              min-w-0
              flex-1
            "
          >
            <Search
              size={16}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="
                Search tasks, description,
                assignee...
              "
              disabled={loading}
              className="
                w-full
                rounded-lg
                border
                border-slate-200
                bg-white
                py-2.5
                pl-9
                pr-3
                text-sm
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:bg-slate-100
              "
            />
          </div>

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            disabled={loading}
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-700
              outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
            "
          >
            <option value={ALL_FILTER}>
              All Status
            </option>

            <option
              value={
                TASK_STATUS.PENDING
              }
            >
              Pending
            </option>

            <option
              value={
                TASK_STATUS.IN_PROGRESS
              }
            >
              In Progress
            </option>

            <option
              value={
                TASK_STATUS.COMPLETED
              }
            >
              Completed
            </option>
          </select>

          {/* Priority */}

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
            disabled={loading}
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-700
              outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
            "
          >
            <option value={ALL_FILTER}>
              All Priority
            </option>

            <option value="high">
              High
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="low">
              Low
            </option>
          </select>

          {/* Assigned To */}

          <select
            value={assignedToFilter}
            onChange={(event) =>
              setAssignedToFilter(
                event.target.value
              )
            }
            disabled={loading}
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-700
              outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
            "
          >
            <option value={ALL_FILTER}>
              All Assignees
            </option>

            {assignedToOptions.map(
              (assignee) => (
                <option
                  key={assignee}
                  value={assignee}
                >
                  {assignee}
                </option>
              )
            )}
          </select>

          {/* Due Date */}

          <select
            value={dueDateFilter}
            onChange={(event) =>
              setDueDateFilter(
                event.target.value
              )
            }
            disabled={loading}
            className="
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-700
              outline-none
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
            "
          >
            <option value={ALL_FILTER}>
              All Due Dates
            </option>

            <option value="overdue">
              Overdue
            </option>

            <option value="today">
              Due Today
            </option>

            <option value="upcoming">
              Upcoming
            </option>

            <option value="no-date">
              No Due Date
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
                shrink-0
                items-center
                justify-center
                gap-1.5
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2.5
                text-xs
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <X size={14} />

              Clear
            </button>
          )}
        </div>

        {/* Result Count */}

        <div
          className="
            mt-3
            flex
            flex-wrap
            items-center
            justify-between
            gap-2
          "
        >
          <p
            className="
              text-xs
              font-medium
              text-slate-500
            "
          >
            {hasActiveFilters
              ? `Showing ${filteredTasks.length} of ${normalizedTasks.length} tasks`
              : `${normalizedTasks.length} ${
                  normalizedTasks.length ===
                  1
                    ? "task"
                    : "tasks"
                }`}
          </p>

          {hasActiveFilters && (
            <span
              className="
                rounded-full
                bg-blue-100
                px-2.5
                py-1
                text-[11px]
                font-semibold
                text-blue-700
              "
            >
              Filters active
            </span>
          )}
        </div>
      </div>

      {/* ====================================================================
          Task Content
      ==================================================================== */}

      <div
        className="
          min-w-0
          px-6
          pb-6
          pt-5
        "
      >
        {normalizedTasks.length ===
        0 ? (
          /* ================================================================
             Empty State
          ================================================================ */

          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              px-6
              py-14
              text-center
            "
          >
            <ListTodo
              size={40}
              className="text-slate-300"
            />

            <h3
              className="
                mt-4
                text-sm
                font-semibold
                text-slate-700
              "
            >
              No tasks available
            </h3>

            <p
              className="
                mt-1
                max-w-sm
                text-xs
                leading-5
                text-slate-500
              "
            >
              Tasks created through the AI
              Task Manager will appear here.
            </p>

            <button
              type="button"
              onClick={
                handleCreateTask
              }
              disabled={loading}
              className="
                mt-5
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                bg-blue-600
                px-4
                py-2
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-blue-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Plus size={14} />

              Create First Task
            </button>
          </div>
        ) : filteredTasks.length ===
          0 ? (
          /* ================================================================
             No Search Result
          ================================================================ */

          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-xl
              border
              border-dashed
              border-slate-300
              bg-slate-50
              px-6
              py-14
              text-center
            "
          >
            <Search
              size={40}
              className="text-slate-300"
            />

            <h3
              className="
                mt-4
                text-sm
                font-semibold
                text-slate-700
              "
            >
              No matching tasks
            </h3>

            <p
              className="
                mt-1
                max-w-sm
                text-xs
                leading-5
                text-slate-500
              "
            >
              Try changing your search or
              filter criteria.
            </p>

            <button
              type="button"
              onClick={
                handleClearFilters
              }
              disabled={loading}
              className="
                mt-5
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                border
                border-slate-200
                bg-white
                px-4
                py-2
                text-xs
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <X size={14} />

              Clear Filters
            </button>
          </div>
        ) : (
          /* ================================================================
             Filtered Task Items
          ================================================================ */

          <div className="space-y-3">
            {filteredTasks.map(
              (task, index) => {
                const taskKey =
                  task?.id ??
                  task?._id ??
                  task?.taskNumber ??
                  task?.emailId ??
                  task?.title ??
                  `task-${index}`;

                return (
                  <TaskListItem
                    key={taskKey}
                    task={task}
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
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

      _id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

      emailId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

      taskNumber:
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
        ]),

      title: PropTypes.string,

      description:
        PropTypes.string,

      status: PropTypes.string,

      priority: PropTypes.string,

      dueDate:
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.instanceOf(Date),
        ]),

      assignedTo:
        PropTypes.string,

      completionPercentage:
        PropTypes.number,
    })
  ),

  onUpdateTask:
    PropTypes.func,

  onDeleteTask:
    PropTypes.func,

  onSelectTask:
    PropTypes.func,

  onRefresh:
    PropTypes.func,

  onCreateTask:
    PropTypes.func,

  loading:
    PropTypes.bool,

  className:
    PropTypes.string,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskList.defaultProps = {
  tasks: DEFAULT_TASKS,

  onUpdateTask:
    undefined,

  onDeleteTask:
    undefined,

  onSelectTask:
    undefined,

  onRefresh:
    undefined,

  onCreateTask:
    undefined,

  loading: false,

  className: "",
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskList.displayName =
  "TaskList";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskList =
  memo(TaskList);

MemoizedTaskList.displayName =
  "MemoizedTaskList";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskList;
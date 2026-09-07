import React, {
  memo,
  useCallback,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  RotateCcw,
  Trash2,
} from "lucide-react";

/* ==========================================================================
Enterprise Constants
========================================================================== */

const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const DEFAULT_TASK = null;

/* ==========================================================================
Helpers
========================================================================== */

const normalizeStatus = (status) => {
  if (!status) {
    return TASK_STATUS.PENDING;
  }

  const value = String(status)
    .trim()
    .toLowerCase();

  if (
    value === "pending" ||
    value === "Pending"
  ) {
    return TASK_STATUS.PENDING;
  }

  if (
    value === "in-progress" ||
    value === "in progress" ||
    value === "in_progress"
  ) {
    return TASK_STATUS.IN_PROGRESS;
  }

  if (
    value === "completed" ||
    value === "complete"
  ) {
    return TASK_STATUS.COMPLETED;
  }

  return value;
};

const normalizePriority = (priority) => {
  if (!priority) {
    return TASK_PRIORITY.MEDIUM;
  }

  const value = String(priority)
    .trim()
    .toLowerCase();

  if (
    value === TASK_PRIORITY.HIGH ||
    value === TASK_PRIORITY.MEDIUM ||
    value === TASK_PRIORITY.LOW
  ) {
    return value;
  }

  return TASK_PRIORITY.MEDIUM;
};

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

const formatStatusLabel = (status) => {
  switch (normalizeStatus(status)) {
    case TASK_STATUS.IN_PROGRESS:
      return "In Progress";

    case TASK_STATUS.COMPLETED:
      return "Completed";

    case TASK_STATUS.PENDING:
      return "Pending";

    default:
      return String(status || "Pending");
  }
};

const formatPriorityLabel = (priority) => {
  switch (normalizePriority(priority)) {
    case TASK_PRIORITY.HIGH:
      return "High";

    case TASK_PRIORITY.LOW:
      return "Low";

    default:
      return "Medium";
  }
};

const getCompletionPercentage = (task) => {
  if (!task) {
    return 0;
  }

  if (
    normalizeStatus(task.status) ===
    TASK_STATUS.COMPLETED
  ) {
    return 100;
  }

  const percentage = Number(
    task.completionPercentage
  );

  if (
    Number.isNaN(percentage)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, percentage)
  );
};

const formatDueDate = (dueDate) => {
  if (!dueDate) {
    return "No due date";
  }

  const date = new Date(dueDate);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Invalid due date";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
};

const isTaskOverdue = (task) => {
  if (!task?.dueDate) {
    return false;
  }

  if (
    normalizeStatus(task.status) ===
    TASK_STATUS.COMPLETED
  ) {
    return false;
  }

  const dueDate = new Date(
    task.dueDate
  );

  if (
    Number.isNaN(
      dueDate.getTime()
    )
  ) {
    return false;
  }

  return dueDate < new Date();
};

/* ==========================================================================
Task List Item
========================================================================== */

const TaskListItem = ({
  task = DEFAULT_TASK,
  loading = false,
  onUpdateTask,
  onDeleteTask,
  onSelectTask,
}) => {
  /* ==========================================================================
  Derived State
  ========================================================================== */

  const taskId = useMemo(
    () => getTaskId(task),
    [task]
  );

  const status = useMemo(
    () =>
      normalizeStatus(
        task?.status
      ),
    [task?.status]
  );

  const priority = useMemo(
    () =>
      normalizePriority(
        task?.priority
      ),
    [task?.priority]
  );

  const completionPercentage =
    useMemo(
      () =>
        getCompletionPercentage(
          task
        ),
      [task]
    );

  const overdue = useMemo(
    () =>
      isTaskOverdue(task),
    [task]
  );

  const dueDateLabel = useMemo(
    () =>
      formatDueDate(
        task?.dueDate
      ),
    [task?.dueDate]
  );

  const statusLabel = useMemo(
    () =>
      formatStatusLabel(
        task?.status
      ),
    [task?.status]
  );

  const priorityLabel = useMemo(
    () =>
      formatPriorityLabel(
        task?.priority
      ),
    [task?.priority]
  );

  const isCompleted =
    status ===
    TASK_STATUS.COMPLETED;

  /* ==========================================================================
  Handlers
  ========================================================================== */

  const handleSelect = useCallback(
    () => {
      if (!task || loading) {
        return;
      }

      onSelectTask?.(task);
    },
    [
      task,
      loading,
      onSelectTask,
    ]
  );

  const handleComplete = useCallback(
    (event) => {
      event.stopPropagation();

      if (
        !task ||
        loading ||
        isCompleted
      ) {
        return;
      }

      onUpdateTask?.({
        ...task,
        status:
          TASK_STATUS.COMPLETED,
        completionPercentage: 100,
        completedAt:
          new Date().toISOString(),
      });
    },
    [
      task,
      loading,
      isCompleted,
      onUpdateTask,
    ]
  );

  const handleReopen = useCallback(
    (event) => {
      event.stopPropagation();

      if (
        !task ||
        loading ||
        !isCompleted
      ) {
        return;
      }

      onUpdateTask?.({
        ...task,
        status:
          TASK_STATUS.PENDING,
        completionPercentage: 0,
        completedAt: null,
      });
    },
    [
      task,
      loading,
      isCompleted,
      onUpdateTask,
    ]
  );

  const handleEdit = useCallback(
    (event) => {
      event.stopPropagation();

      if (
        !task ||
        loading
      ) {
        return;
      }

      onSelectTask?.(task);
    },
    [
      task,
      loading,
      onSelectTask,
    ]
  );

  const handleDelete = useCallback(
    (event) => {
      event.stopPropagation();

      if (
        !task ||
        loading
      ) {
        return;
      }

      onDeleteTask?.(task);
    },
    [
      task,
      loading,
      onDeleteTask,
    ]
  );

  /* ==========================================================================
  Empty Protection
  ========================================================================== */

  if (!task) {
    return null;
  }

  /* ==========================================================================
  Render
  ========================================================================== */

  return (
    <article
      role="button"
      tabIndex={loading ? -1 : 0}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (
          loading
        ) {
          return;
        }

        if (
          event.key ===
            "Enter" ||
          event.key ===
            " "
        ) {
          event.preventDefault();
          handleSelect();
        }
      }}
      className={clsx(
        "group",
        "relative",
        "rounded-xl",
        "border",
        "border-slate-200",
        "bg-white",
        "p-4",
        "shadow-sm",
        "transition-all",
        "duration-200",

        !loading &&
          "cursor-pointer",

        !loading &&
          "hover:border-blue-200",

        !loading &&
          "hover:shadow-md",

        loading &&
          "cursor-wait",
        loading &&
          "opacity-70"
      )}
    >
      {/* ======================================================================
      Top Row
      ====================================================================== */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        {/* Task Identity */}

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            {/* Status */}

            <span
              className={clsx(
                "inline-flex",
                "items-center",
                "gap-1.5",
                "rounded-full",
                "px-2.5",
                "py-1",
                "text-[11px]",
                "font-semibold",

                status ===
                  TASK_STATUS.COMPLETED &&
                  "bg-green-100 text-green-700",

                status ===
                  TASK_STATUS.IN_PROGRESS &&
                  "bg-blue-100 text-blue-700",

                status ===
                  TASK_STATUS.PENDING &&
                  "bg-amber-100 text-amber-700",

                status !==
                    TASK_STATUS.COMPLETED &&
                  status !==
                    TASK_STATUS.IN_PROGRESS &&
                  status !==
                    TASK_STATUS.PENDING &&
                  "bg-slate-100 text-slate-700"
              )}
            >
              {status ===
                TASK_STATUS.COMPLETED ? (
                <CheckCircle2
                  size={12}
                />
              ) : (
                <Clock3
                  size={12}
                />
              )}

              {statusLabel}
            </span>

            {/* Priority */}

            <span
              className={clsx(
                "rounded-full",
                "px-2.5",
                "py-1",
                "text-[11px]",
                "font-semibold",

                priority ===
                  TASK_PRIORITY.HIGH &&
                  "bg-red-100 text-red-700",

                priority ===
                  TASK_PRIORITY.MEDIUM &&
                  "bg-orange-100 text-orange-700",

                priority ===
                  TASK_PRIORITY.LOW &&
                  "bg-slate-100 text-slate-600"
              )}
            >
              {priorityLabel}
            </span>

            {/* Task Number */}

            {task.taskNumber && (
              <span
                className="
                  text-[11px]
                  font-medium
                  text-slate-400
                "
              >
                #{task.taskNumber}
              </span>
            )}
          </div>

          {/* Title */}

          <h3
            className="
              mt-2
              truncate
              text-sm
              font-bold
              text-slate-900
            "
            title={
              task.title ||
              "Untitled task"
            }
          >
            {task.title ||
              "Untitled task"}
          </h3>

          {/* Description */}

          {task.description && (
            <p
              className="
                mt-1
                line-clamp-2
                text-xs
                leading-5
                text-slate-500
              "
            >
              {task.description}
            </p>
          )}
        </div>

        {/* Open Details */}

        <ChevronRight
          size={18}
          className="
            mt-1
            shrink-0
            text-slate-300
            transition-transform
            group-hover:translate-x-0.5
            group-hover:text-blue-500
          "
        />
      </div>

      {/* ======================================================================
      Meta Information
      ====================================================================== */}

      <div
        className="
          mt-4
          grid
          grid-cols-1
          gap-2
          sm:grid-cols-3
        "
      >
        {/* Assignee */}

        <div
          className="
            rounded-lg
            bg-slate-50
            px-3
            py-2
          "
        >
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Assigned To
          </p>

          <p
            className="
              mt-1
              truncate
              text-xs
              font-medium
              text-slate-700
            "
          >
            {task.assignedTo ||
              "Unassigned"}
          </p>
        </div>

        {/* Due Date */}

        <div
          className={clsx(
            "rounded-lg",
            "px-3",
            "py-2",
            overdue
              ? "bg-red-50"
              : "bg-slate-50"
          )}
        >
          <p
            className={clsx(
              "text-[10px]",
              "font-semibold",
              "uppercase",
              "tracking-wide",
              overdue
                ? "text-red-400"
                : "text-slate-400"
            )}
          >
            Due Date
          </p>

          <div
            className="
              mt-1
              flex
              items-center
              gap-1
            "
          >
            {overdue && (
              <AlertCircle
                size={12}
                className="text-red-500"
              />
            )}

            <p
              className={clsx(
                "truncate",
                "text-xs",
                "font-medium",
                overdue
                  ? "text-red-700"
                  : "text-slate-700"
              )}
            >
              {overdue
                ? `Overdue · ${dueDateLabel}`
                : dueDateLabel}
            </p>
          </div>
        </div>

        {/* Completion */}

        <div
          className="
            rounded-lg
            bg-slate-50
            px-3
            py-2
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-slate-400
              "
            >
              Completion
            </p>

            <span
              className="
                text-xs
                font-bold
                text-slate-700
              "
            >
              {completionPercentage}%
            </span>
          </div>

          <div
            className="
              mt-2
              h-1.5
              overflow-hidden
              rounded-full
              bg-slate-200
            "
          >
            <div
              className={clsx(
                "h-full",
                "rounded-full",
                "transition-all",
                "duration-300",

                isCompleted
                  ? "bg-green-500"
                  : completionPercentage >=
                      70
                    ? "bg-blue-500"
                    : completionPercentage >=
                        40
                      ? "bg-amber-500"
                      : "bg-slate-400"
              )}
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================================
      Bottom Actions
      ====================================================================== */}

      <div
        className="
          mt-4
          flex
          flex-wrap
          items-center
          justify-between
          gap-2
          border-t
          border-slate-100
          pt-3
        "
      >
        {/* Left Side */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          {/* Complete / Reopen */}

          {isCompleted ? (
            <button
              type="button"
              onClick={
                handleReopen
              }
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
                py-1.5
                text-xs
                font-semibold
                text-slate-600
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Reopen task"
            >
              <RotateCcw
                size={13}
              />

              Reopen
            </button>
          ) : (
            <button
              type="button"
              onClick={
                handleComplete
              }
              disabled={loading}
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-lg
                bg-green-600
                px-3
                py-1.5
                text-xs
                font-semibold
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
              aria-label="Complete task"
            >
              <CheckCircle2
                size={13}
              />

              Complete
            </button>
          )}
        </div>

        {/* Right Side */}

        <div
          className="
            flex
            items-center
            gap-1
          "
        >
          {/* Edit */}

          <button
            type="button"
            onClick={handleEdit}
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
              py-1.5
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:border-blue-200
              hover:bg-blue-50
              hover:text-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Edit task"
          >
            <Edit3
              size={13}
            />

            Edit
          </button>

          {/* Delete */}

          <button
            type="button"
            onClick={
              handleDelete
            }
            disabled={loading}
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-lg
              border
              border-red-200
              bg-white
              px-3
              py-1.5
              text-xs
              font-semibold
              text-red-600
              transition
              hover:bg-red-50
              hover:text-red-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            aria-label="Delete task"
          >
            <Trash2
              size={13}
            />

            Delete
          </button>
        </div>
      </div>

      {/* ======================================================================
      Loading Overlay
      ====================================================================== */}

      {loading && (
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            rounded-xl
            bg-white/30
          "
          aria-hidden="true"
        />
      )}
    </article>
  );
};

/* ==========================================================================
PropTypes
========================================================================== */

TaskListItem.propTypes = {
  task: PropTypes.shape({
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
        PropTypes.instanceOf(
          Date
        ),
      ]),

    assignedTo:
      PropTypes.string,

    completionPercentage:
      PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]),

    completedAt:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(
          Date
        ),
      ]),
  }),

  loading: PropTypes.bool,

  onUpdateTask:
    PropTypes.func,

  onDeleteTask:
    PropTypes.func,

  onSelectTask:
    PropTypes.func,
};

/* ==========================================================================
Default Props
========================================================================== */

TaskListItem.defaultProps = {
  task: DEFAULT_TASK,

  loading: false,

  onUpdateTask:
    undefined,

  onDeleteTask:
    undefined,

  onSelectTask:
    undefined,
};

/* ==========================================================================
Display Name
========================================================================== */

TaskListItem.displayName =
  "TaskListItem";

/* ==========================================================================
Memoized Export
========================================================================== */

const MemoizedTaskListItem =
  memo(TaskListItem);

MemoizedTaskListItem.displayName =
  "MemoizedTaskListItem";

/* ==========================================================================
Default Export
========================================================================== */

export default MemoizedTaskListItem;
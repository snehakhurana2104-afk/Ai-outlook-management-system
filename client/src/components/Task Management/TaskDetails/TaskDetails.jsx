import React, {
  memo,
  useCallback,
  useMemo,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Mail,
  RotateCcw,
  Trash2,
  User,
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

/* ==========================================================================
   Helpers
========================================================================== */

const normalizeStatus = (status) => {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  switch (value) {
    case "completed":
    case "complete":
      return TASK_STATUS.COMPLETED;

    case "in-progress":
    case "in progress":
    case "in_progress":
      return TASK_STATUS.IN_PROGRESS;

    case "pending":
    default:
      return TASK_STATUS.PENDING;
  }
};

const normalizePriority = (priority) => {
  const value = String(priority || "")
    .trim()
    .toLowerCase();

  switch (value) {
    case TASK_PRIORITY.HIGH:
      return TASK_PRIORITY.HIGH;

    case TASK_PRIORITY.LOW:
      return TASK_PRIORITY.LOW;

    case TASK_PRIORITY.MEDIUM:
    default:
      return TASK_PRIORITY.MEDIUM;
  }
};

const formatDate = (value) => {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ==========================================================================
   Task Details View
========================================================================== */

const TaskDetailsView = ({
  task = null,
  loading = false,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}) => {
  /* ==========================================================================
     Derived Task Data
  ========================================================================== */

  const normalizedStatus = useMemo(
    () => normalizeStatus(task?.status),
    [task?.status]
  );

  const normalizedPriority = useMemo(
    () => normalizePriority(task?.priority),
    [task?.priority]
  );

  const isCompleted =
    normalizedStatus === TASK_STATUS.COMPLETED;

  const isInProgress =
    normalizedStatus === TASK_STATUS.IN_PROGRESS;

  const isPending =
    normalizedStatus === TASK_STATUS.PENDING;

  /* ==========================================================================
     Completion Percentage
  ========================================================================== */

  const completionPercentage = useMemo(() => {
    if (isCompleted) {
      return 100;
    }

    const value = Number(
      task?.completionPercentage
    );

    if (
      Number.isNaN(value) ||
      value < 0
    ) {
      return 0;
    }

    return Math.min(100, value);
  }, [
    task?.completionPercentage,
    isCompleted,
  ]);

  /* ==========================================================================
     Due Date State
  ========================================================================== */

  const dueDateState = useMemo(() => {
    if (!task?.dueDate) {
      return {
        label: "No due date",
        isOverdue: false,
      };
    }

    const dueDate = new Date(
      task.dueDate
    );

    if (
      Number.isNaN(
        dueDate.getTime()
      )
    ) {
      return {
        label: "Invalid date",
        isOverdue: false,
      };
    }

    const now = new Date();

    const isOverdue =
      !isCompleted &&
      dueDate < now;

    return {
      label: formatDate(task.dueDate),
      isOverdue,
    };
  }, [
    task?.dueDate,
    isCompleted,
  ]);

  /* ==========================================================================
     Status Configuration
  ========================================================================== */

  const statusConfig = useMemo(() => {
    if (isCompleted) {
      return {
        label: "Completed",
        icon: CheckCircle2,
        wrapper:
          "border-green-200 bg-green-50",
        text:
          "text-green-700",
        iconClass:
          "text-green-600",
      };
    }

    if (isInProgress) {
      return {
        label: "In Progress",
        icon: Clock3,
        wrapper:
          "border-blue-200 bg-blue-50",
        text:
          "text-blue-700",
        iconClass:
          "text-blue-600",
      };
    }

    return {
      label: "Pending",
      icon: Clock3,
      wrapper:
        "border-amber-200 bg-amber-50",
      text:
        "text-amber-700",
      iconClass:
        "text-amber-600",
    };
  }, [
    isCompleted,
    isInProgress,
  ]);

  const StatusIcon =
    statusConfig.icon;

  /* ==========================================================================
     Priority Configuration
  ========================================================================== */

  const priorityConfig = useMemo(() => {
    switch (normalizedPriority) {
      case TASK_PRIORITY.HIGH:
        return {
          label: "High",
          className:
            "bg-red-100 text-red-700 border-red-200",
        };

      case TASK_PRIORITY.LOW:
        return {
          label: "Low",
          className:
            "bg-slate-100 text-slate-700 border-slate-200",
        };

      case TASK_PRIORITY.MEDIUM:
      default:
        return {
          label: "Medium",
          className:
            "bg-amber-100 text-amber-700 border-amber-200",
        };
    }
  }, [
    normalizedPriority,
  ]);

  /* ==========================================================================
     Handlers
  ========================================================================== */

  const handleComplete = useCallback(() => {
    if (
      !task ||
      loading ||
      isCompleted
    ) {
      return;
    }

    onComplete?.();
  }, [
    task,
    loading,
    isCompleted,
    onComplete,
  ]);

  const handleReopen = useCallback(() => {
    if (
      !task ||
      loading ||
      !isCompleted
    ) {
      return;
    }

    onReopen?.();
  }, [
    task,
    loading,
    isCompleted,
    onReopen,
  ]);

  const handleEdit = useCallback(() => {
    if (
      !task ||
      loading
    ) {
      return;
    }

    onEdit?.();
  }, [
    task,
    loading,
    onEdit,
  ]);

  const handleDelete = useCallback(() => {
    if (
      !task ||
      loading
    ) {
      return;
    }

    onDelete?.();
  }, [
    task,
    loading,
    onDelete,
  ]);

  /* ==========================================================================
     Render
  ========================================================================== */

  if (!task) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-col">
      {/* ====================================================================
          Task Header
      ==================================================================== */}

      <div
        className="
          border-b
          border-slate-200
          px-6
          py-5
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            sm:flex-row
            sm:items-start
            sm:justify-between
          "
        >
          <div className="min-w-0 flex-1">
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              {task.taskNumber && (
                <span
                  className="
                    rounded-md
                    bg-slate-100
                    px-2
                    py-1
                    text-[11px]
                    font-semibold
                    text-slate-600
                  "
                >
                  #{task.taskNumber}
                </span>
              )}

              <span
                className={clsx(
                  "inline-flex",
                  "items-center",
                  "gap-1.5",
                  "rounded-md",
                  "border",
                  "px-2",
                  "py-1",
                  "text-[11px]",
                  "font-semibold",
                  statusConfig.wrapper,
                  statusConfig.text
                )}
              >
                <StatusIcon
                  size={13}
                  className={
                    statusConfig.iconClass
                  }
                />

                {statusConfig.label}
              </span>

              <span
                className={clsx(
                  "rounded-md",
                  "border",
                  "px-2",
                  "py-1",
                  "text-[11px]",
                  "font-semibold",
                  priorityConfig.className
                )}
              >
                {priorityConfig.label} Priority
              </span>
            </div>

            <h2
              className="
                mt-3
                break-words
                text-lg
                font-bold
                leading-7
                text-slate-900
              "
            >
              {task.title || "Untitled Task"}
            </h2>

            {task.emailId && (
              <div
                className="
                  mt-2
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-slate-500
                "
              >
                <Mail size={14} />

                <span className="break-all">
                  Email ID: {task.emailId}
                </span>
              </div>
            )}
          </div>

          {/* Header Actions */}

          <div
            className="
              flex
              shrink-0
              flex-wrap
              items-center
              gap-2
            "
          >
            {!isCompleted && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-green-600
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:bg-green-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <CheckCircle2
                  size={14}
                />

                Complete
              </button>
            )}

            {isCompleted && (
              <button
                type="button"
                onClick={handleReopen}
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
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <RotateCcw
                  size={14}
                />

                Reopen
              </button>
            )}

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
                py-2
                text-xs
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Edit3 size={14} />

              Edit
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          Main Information
      ==================================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-6
          px-6
          py-6
          lg:grid-cols-[minmax(0,1fr)_300px]
        "
      >
        {/* ==================================================================
            Left Column
        ================================================================== */}

        <div className="min-w-0 space-y-6">
          {/* Description */}

          <section>
            <h3
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Description
            </h3>

            <div
              className="
                mt-3
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-4
              "
            >
              {task.description ? (
                <p
                  className="
                    whitespace-pre-wrap
                    break-words
                    text-sm
                    leading-6
                    text-slate-700
                  "
                >
                  {task.description}
                </p>
              ) : (
                <p
                  className="
                    text-sm
                    italic
                    text-slate-400
                  "
                >
                  No description provided.
                </p>
              )}
            </div>
          </section>

          {/* Progress */}

          <section>
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >
              <h3
                className="
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  text-slate-500
                "
              >
                Completion
              </h3>

              <span
                className="
                  text-sm
                  font-bold
                  text-slate-800
                "
              >
                {completionPercentage}%
              </span>
            </div>

            <div
              className="
                mt-3
                h-2
                overflow-hidden
                rounded-full
                bg-slate-100
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-blue-600
                  transition-all
                  duration-300
                "
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </section>

          {/* Task Information */}

          <section>
            <h3
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Task Information
            </h3>

            <div
              className="
                mt-3
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
              "
            >
              {/* Due Date */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  <CalendarDays
                    size={15}
                  />

                  Due Date
                </div>

                <p
                  className={clsx(
                    "mt-2",
                    "text-sm",
                    "font-semibold",
                    dueDateState.isOverdue
                      ? "text-red-600"
                      : "text-slate-800"
                  )}
                >
                  {dueDateState.label}
                </p>

                {dueDateState.isOverdue && (
                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-1.5
                      text-[11px]
                      font-medium
                      text-red-600
                    "
                  >
                    <AlertCircle
                      size={13}
                    />

                    Overdue
                  </div>
                )}
              </div>

              {/* Assigned To */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  <User size={15} />

                  Assigned To
                </div>

                <p
                  className="
                    mt-2
                    break-words
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {task.assignedTo ||
                    "Unassigned"}
                </p>
              </div>

              {/* Status */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  <StatusIcon
                    size={15}
                  />

                  Status
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {statusConfig.label}
                </p>
              </div>

              {/* Priority */}

              <div
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-4
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-semibold
                    text-slate-500
                  "
                >
                  <AlertCircle
                    size={15}
                  />

                  Priority
                </div>

                <p
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    capitalize
                    text-slate-800
                  "
                >
                  {priorityConfig.label}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ==================================================================
            Right Column
        ================================================================== */}

        <aside
          className="
            min-w-0
            space-y-4
          "
        >
          {/* Activity */}

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <h3
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
                text-slate-500
              "
            >
              Activity
            </h3>

            <div
              className="
                mt-4
                space-y-4
              "
            >
              <div>
                <p
                  className="
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  Created
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-semibold
                    text-slate-700
                  "
                >
                  {formatDateTime(
                    task.createdAt
                  )}
                </p>
              </div>

              <div>
                <p
                  className="
                    text-[11px]
                    font-medium
                    text-slate-400
                  "
                >
                  Last Updated
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    font-semibold
                    text-slate-700
                  "
                >
                  {formatDateTime(
                    task.updatedAt
                  )}
                </p>
              </div>

              {task.completedAt && (
                <div>
                  <p
                    className="
                      text-[11px]
                      font-medium
                      text-slate-400
                    "
                  >
                    Completed
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      font-semibold
                      text-green-700
                    "
                  >
                    {formatDateTime(
                      task.completedAt
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Status */}

          <div
            className={clsx(
              "rounded-xl",
              "border",
              "p-4",
              statusConfig.wrapper
            )}
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <StatusIcon
                size={18}
                className={
                  statusConfig.iconClass
                }
              />

              <p
                className={clsx(
                  "text-sm",
                  "font-bold",
                  statusConfig.text
                )}
              >
                {statusConfig.label}
              </p>
            </div>

            <p
              className={clsx(
                "mt-2",
                "text-xs",
                "leading-5",
                statusConfig.text
              )}
            >
              {isCompleted
                ? "This task has been completed successfully."
                : isInProgress
                ? "This task is currently being worked on."
                : "This task is waiting to be completed."}
            </p>
          </div>

          {/* Delete */}

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="
              inline-flex
              w-full
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-red-200
              bg-white
              px-4
              py-2.5
              text-xs
              font-semibold
              text-red-600
              transition
              hover:bg-red-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <Trash2 size={14} />

            Delete Task
          </button>
        </aside>
      </div>
    </div>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskDetailsView.propTypes = {
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

    taskNumber: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    title: PropTypes.string,

    description: PropTypes.string,

    status: PropTypes.string,

    priority: PropTypes.string,

    dueDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    assignedTo: PropTypes.string,

    completionPercentage:
      PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]),

    createdAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    updatedAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    completedAt: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
  }),

  loading: PropTypes.bool,

  onComplete: PropTypes.func,

  onReopen: PropTypes.func,

  onEdit: PropTypes.func,

  onDelete: PropTypes.func,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskDetailsView.defaultProps = {
  task: null,

  loading: false,

  onComplete: undefined,

  onReopen: undefined,

  onEdit: undefined,

  onDelete: undefined,
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskDetailsView.displayName =
  "TaskDetailsView";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskDetailsView =
  memo(TaskDetailsView);

MemoizedTaskDetailsView.displayName =
  "MemoizedTaskDetailsView";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskDetailsView;
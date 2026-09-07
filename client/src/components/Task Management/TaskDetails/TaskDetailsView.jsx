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
import TaskDetailsHeader from "./TaskDetailsHeader";
import TaskDetailsEmpty from "./TaskDetailsEmpty";
import TaskDetailsView from "./TaskDetailsView";
import TaskDetailsEditForm from "./TaskDetailsEditForm";

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

const normalizeText = (value) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
};

const formatStatus = (status) => {
  switch (status) {
    case TASK_STATUS.PENDING:
      return "Pending";

    case TASK_STATUS.IN_PROGRESS:
      return "In Progress";

    case TASK_STATUS.COMPLETED:
      return "Completed";

    default:
      return "Unknown";
  }
};

const formatPriority = (priority) => {
  switch (priority) {
    case TASK_PRIORITY.LOW:
      return "Low";

    case TASK_PRIORITY.MEDIUM:
      return "Medium";

    case TASK_PRIORITY.HIGH:
      return "High";

    default:
      return "Medium";
  }
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "Not set";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
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
};

/* ==========================================================================
   Task Details View
========================================================================== */

const TaskDetailsView = ({
  task = DEFAULT_TASK,
  loading = false,
  onComplete,
  onReopen,
  onEdit,
  onDelete,
}) => {
  /* ==========================================================================
     Derived Values
  ========================================================================== */

  const taskTitle = useMemo(
    () =>
      normalizeText(
        task?.title
      ) || "Untitled Task",
    [task?.title]
  );

  const taskDescription = useMemo(
    () =>
      normalizeText(
        task?.description
      ),
    [task?.description]
  );

  const taskStatus = useMemo(
    () =>
      task?.status ||
      TASK_STATUS.PENDING,
    [task?.status]
  );

  const taskPriority = useMemo(
    () =>
      task?.priority ||
      TASK_PRIORITY.MEDIUM,
    [task?.priority]
  );

  const taskNumber = useMemo(
    () =>
      normalizeText(
        task?.taskNumber
      ),
    [task?.taskNumber]
  );

  const emailId = useMemo(
    () =>
      normalizeText(
        task?.emailId
      ),
    [task?.emailId]
  );

  const assignedTo = useMemo(
    () =>
      normalizeText(
        task?.assignedTo
      ),
    [task?.assignedTo]
  );

  const dueDateLabel = useMemo(
    () =>
      formatDate(
        task?.dueDate
      ),
    [task?.dueDate]
  );

  const overdue = useMemo(
    () =>
      isTaskOverdue(task),
    [task]
  );

  const completionPercentage =
    useMemo(() => {
      const value = Number(
        task?.completionPercentage
      );

      if (
        Number.isNaN(value)
      ) {
        return taskStatus ===
          TASK_STATUS.COMPLETED
          ? 100
          : 0;
      }

      return Math.min(
        100,
        Math.max(0, value)
      );
    }, [
      task?.completionPercentage,
      taskStatus,
    ]);

  /* ==========================================================================
     Status Styling
  ========================================================================== */

  const statusConfig =
    useMemo(() => {
      switch (taskStatus) {
        case TASK_STATUS.COMPLETED:
          return {
            label: "Completed",
            className:
              "bg-green-100 text-green-700 border-green-200",
            icon: CheckCircle2,
          };

        case TASK_STATUS.IN_PROGRESS:
          return {
            label: "In Progress",
            className:
              "bg-blue-100 text-blue-700 border-blue-200",
            icon: Clock3,
          };

        case TASK_STATUS.PENDING:
        default:
          return {
            label: "Pending",
            className:
              "bg-amber-100 text-amber-700 border-amber-200",
            icon: Clock3,
          };
      }
    }, [taskStatus]);

  const StatusIcon =
    statusConfig.icon;

  /* ==========================================================================
     Priority Styling
  ========================================================================== */

  const priorityClassName =
    useMemo(() => {
      switch (taskPriority) {
        case TASK_PRIORITY.HIGH:
          return (
            "bg-red-100 " +
            "text-red-700 " +
            "border-red-200"
          );

        case TASK_PRIORITY.LOW:
          return (
            "bg-slate-100 " +
            "text-slate-600 " +
            "border-slate-200"
          );

        case TASK_PRIORITY.MEDIUM:
        default:
          return (
            "bg-blue-100 " +
            "text-blue-700 " +
            "border-blue-200"
          );
      }
    }, [taskPriority]);

  /* ==========================================================================
     Handlers
  ========================================================================== */

  const handleComplete =
    useCallback(() => {
      if (!task || loading) {
        return;
      }

      onComplete?.(task);
    }, [
      task,
      loading,
      onComplete,
    ]);

  const handleReopen =
    useCallback(() => {
      if (!task || loading) {
        return;
      }

      onReopen?.(task);
    }, [
      task,
      loading,
      onReopen,
    ]);

  const handleEdit =
    useCallback(() => {
      if (!task || loading) {
        return;
      }

      onEdit?.(task);
    }, [
      task,
      loading,
      onEdit,
    ]);

  const handleDelete =
    useCallback(() => {
      if (!task || loading) {
        return;
      }

      onDelete?.(task);
    }, [
      task,
      loading,
      onDelete,
    ]);

  /* ==========================================================================
     Empty Guard
  ========================================================================== */

  if (!task) {
    return (
      <div
        className="
          flex
          min-h-[320px]
          items-center
          justify-center
          p-6
          text-center
        "
      >
        <div>
          <AlertCircle
            size={40}
            className="
              mx-auto
              text-slate-300
            "
          />

          <p
            className="
              mt-4
              text-sm
              font-semibold
              text-slate-700
            "
          >
            No task selected
          </p>

          <p
            className="
              mt-1
              text-xs
              text-slate-500
            "
          >
            Select a task to view
            its details.
          </p>
        </div>
      </div>
    );
  }

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <div
      className="
        flex
        flex-col
        gap-6
        p-6
      "
    >
      {/* ====================================================================
          Task Identity
      ==================================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          p-5
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <div
            className="
              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            {taskNumber && (
              <span
                className="
                  rounded-md
                  bg-slate-200
                  px-2
                  py-1
                  text-[11px]
                  font-bold
                  text-slate-600
                "
              >
                #{taskNumber}
              </span>
            )}

            <span
              className={clsx(
                "inline-flex",
                "items-center",
                "gap-1.5",
                "rounded-full",
                "border",
                "px-2.5",
                "py-1",
                "text-[11px]",
                "font-semibold",
                statusConfig.className
              )}
            >
              <StatusIcon
                size={13}
              />

              {statusConfig.label}
            </span>

            <span
              className={clsx(
                "rounded-full",
                "border",
                "px-2.5",
                "py-1",
                "text-[11px]",
                "font-semibold",
                priorityClassName
              )}
            >
              {formatPriority(
                taskPriority
              )}
            </span>
          </div>

          <h3
            className="
              mt-3
              break-words
              text-lg
              font-bold
              text-slate-900
            "
          >
            {taskTitle}
          </h3>
        </div>

        {/* Edit */}

        <button
          type="button"
          onClick={handleEdit}
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
          <Edit3 size={14} />

          Edit Task
        </button>
      </div>

      {/* ====================================================================
          Description
      ==================================================================== */}

      <section>
        <h4
          className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-slate-500
          "
        >
          Description
        </h4>

        <div
          className="
            mt-2
            rounded-xl
            border
            border-slate-200
            bg-white
            p-4
          "
        >
          {taskDescription ? (
            <p
              className="
                whitespace-pre-wrap
                break-words
                text-sm
                leading-6
                text-slate-700
              "
            >
              {taskDescription}
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

      {/* ====================================================================
          Task Information
      ==================================================================== */}

      <section>
        <h4
          className="
            text-xs
            font-bold
            uppercase
            tracking-wide
            text-slate-500
          "
        >
          Task Information
        </h4>

        <div
          className="
            mt-3
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-2
          "
        >
          {/* Status */}

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                font-medium
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
              {formatStatus(
                taskStatus
              )}
            </p>
          </div>

          {/* Priority */}

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                font-medium
                text-slate-500
              "
            >
              Priority
            </div>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                text-slate-800
              "
            >
              {formatPriority(
                taskPriority
              )}
            </p>
          </div>

          {/* Due Date */}

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                font-medium
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
                overdue
                  ? "text-red-600"
                  : "text-slate-800"
              )}
            >
              {dueDateLabel}
            </p>

            {overdue && (
              <p
                className="
                  mt-1
                  text-[11px]
                  font-medium
                  text-red-600
                "
              >
                Overdue
              </p>
            )}
          </div>

          {/* Assigned To */}

          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-xs
                font-medium
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
              {assignedTo ||
                "Not assigned"}
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Progress
      ==================================================================== */}

      <section>
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <h4
            className="
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            Completion
          </h4>

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
            h-2
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
              taskStatus ===
                TASK_STATUS.COMPLETED
                ? "bg-green-500"
                : "bg-blue-500"
            )}
            style={{
              width: `${completionPercentage}%`,
            }}
          />
        </div>
      </section>

      {/* ====================================================================
          Email Reference
      ==================================================================== */}

      {(emailId ||
        task.emailSubject) && (
        <section>
          <h4
            className="
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            Email Reference
          </h4>

          <div
            className="
              mt-3
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-4
            "
          >
            <div
              className="
                flex
                items-start
                gap-3
              "
            >
              <Mail
                size={18}
                className="
                  mt-0.5
                  shrink-0
                  text-blue-600
                "
              />

              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                  "
                >
                  Source Email
                </p>

                {task.emailSubject && (
                  <p
                    className="
                      mt-1
                      break-words
                      text-sm
                      font-semibold
                      text-slate-800
                    "
                  >
                    {task.emailSubject}
                  </p>
                )}

                {emailId && (
                  <p
                    className="
                      mt-1
                      break-all
                      text-[11px]
                      text-slate-500
                    "
                  >
                    Email ID: {emailId}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          Overdue Warning
      ==================================================================== */}

      {overdue && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
          "
        >
          <AlertCircle
            size={18}
            className="
              mt-0.5
              shrink-0
              text-red-600
            "
          />

          <div>
            <p
              className="
                text-xs
                font-bold
                text-red-800
              "
            >
              This task is overdue
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-red-700
            "
            >
              The due date has passed and
              the task is not completed.
            </p>
          </div>
        </div>
      )}

      {/* ====================================================================
          Actions
      ==================================================================== */}

      <div
        className="
          flex
          flex-col
          gap-2
          border-t
          border-slate-200
          pt-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* Delete */}

        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="
            inline-flex
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
          <Trash2 size={15} />

          Delete Task
        </button>

        <div
          className="
            flex
            flex-col
            gap-2
            sm:flex-row
          "
        >
          {taskStatus ===
            TASK_STATUS.COMPLETED ? (
            <button
              type="button"
              onClick={handleReopen}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-1.5
                rounded-lg
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
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
                size={15}
              />

              Reopen Task
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-1.5
                rounded-lg
                bg-green-600
                px-4
                py-2.5
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
                size={15}
              />

              Mark Completed
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          Loading Footer
      ==================================================================== */}

      {loading && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-slate-50
            px-4
            py-3
            text-xs
            font-medium
            text-slate-500
          "
        >
          <Clock3 size={14} />

          Updating task...
        </div>
      )}
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

    taskNumber:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]),

    title: PropTypes.string,

    description:
      PropTypes.string,

    emailSubject:
      PropTypes.string,

    status: PropTypes.oneOf([
      TASK_STATUS.PENDING,
      TASK_STATUS.IN_PROGRESS,
      TASK_STATUS.COMPLETED,
    ]),

    priority: PropTypes.oneOf([
      TASK_PRIORITY.LOW,
      TASK_PRIORITY.MEDIUM,
      TASK_PRIORITY.HIGH,
    ]),

    dueDate:
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Date),
      ]),

    assignedTo:
      PropTypes.string,

    completionPercentage:
      PropTypes.number,
  }),

  loading:
    PropTypes.bool,

  onComplete:
    PropTypes.func,

  onReopen:
    PropTypes.func,

  onEdit:
    PropTypes.func,

  onDelete:
    PropTypes.func,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskDetailsView.defaultProps = {
  task: DEFAULT_TASK,

  loading: false,

  onComplete:
    undefined,

  onReopen:
    undefined,

  onEdit:
    undefined,

  onDelete:
    undefined,
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
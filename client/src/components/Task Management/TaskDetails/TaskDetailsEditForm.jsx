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
  Loader2,
  Save,
  User,
  X,
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
   Task Details Edit Form
========================================================================== */

const TaskDetailsEditForm = ({
  title = "",
  description = "",
  priority = TASK_PRIORITY.MEDIUM,
  status = TASK_STATUS.PENDING,
  dueDate = "",
  assignedTo = "",
  loading = false,

  onTitleChange,
  onDescriptionChange,
  onPriorityChange,
  onStatusChange,
  onDueDateChange,
  onAssignedToChange,

  onCancel,
  onSave,
}) => {
  /* ==========================================================================
     Validation
  ========================================================================== */

  const trimmedTitle = useMemo(
    () => title.trim(),
    [title]
  );

  const isTitleValid = Boolean(
    trimmedTitle
  );

  const canSave =
    isTitleValid && !loading;

  /* ==========================================================================
     Handlers
  ========================================================================== */

  const handleTitleChange = useCallback(
    (event) => {
      onTitleChange?.(
        event.target.value
      );
    },
    [onTitleChange]
  );

  const handleDescriptionChange =
    useCallback(
      (event) => {
        onDescriptionChange?.(
          event.target.value
        );
      },
      [onDescriptionChange]
    );

  const handlePriorityChange =
    useCallback(
      (event) => {
        onPriorityChange?.(
          event.target.value
        );
      },
      [onPriorityChange]
    );

  const handleStatusChange =
    useCallback(
      (event) => {
        onStatusChange?.(
          event.target.value
        );
      },
      [onStatusChange]
    );

  const handleDueDateChange =
    useCallback(
      (event) => {
        onDueDateChange?.(
          event.target.value
        );
      },
      [onDueDateChange]
    );

  const handleAssignedToChange =
    useCallback(
      (event) => {
        onAssignedToChange?.(
          event.target.value
        );
      },
      [onAssignedToChange]
    );

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!canSave) {
        return;
      }

      await onSave?.();
    },
    [canSave, onSave]
  );

  const handleCancel = useCallback(() => {
    if (loading) {
      return;
    }

    onCancel?.();
  }, [loading, onCancel]);

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex
        flex-col
        gap-6
        p-6
      "
    >
      {/* ====================================================================
          Form Header
      ==================================================================== */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-4
          border-b
          border-slate-200
          pb-5
        "
      >
        <div>
          <h3
            className="
              text-base
              font-bold
              text-slate-900
            "
          >
            Edit Task
          </h3>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-slate-500
            "
          >
            Update task information and
            assignment details.
          </p>
        </div>

        {loading && (
          <div
            className="
              inline-flex
              shrink-0
              items-center
              gap-2
              rounded-lg
              bg-blue-50
              px-3
              py-2
              text-xs
              font-semibold
              text-blue-700
            "
          >
            <Loader2
              size={14}
              className="animate-spin"
            />

            Saving...
          </div>
        )}
      </div>

      {/* ====================================================================
          Title
      ==================================================================== */}

      <div className="space-y-2">
        <label
          htmlFor="task-title"
          className="
            block
            text-xs
            font-semibold
            text-slate-700
          "
        >
          Task Title
          <span className="ml-1 text-red-500">
            *
          </span>
        </label>

        <input
          id="task-title"
          type="text"
          value={title}
          onChange={
            handleTitleChange
          }
          disabled={loading}
          maxLength={200}
          placeholder="Enter task title"
          autoComplete="off"
          className={clsx(
            `
              w-full
              rounded-lg
              border
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-800
              outline-none
              transition
              placeholder:text-slate-400
              focus:ring-2
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-500
            `,
            isTitleValid
              ? `
                border-slate-200
                focus:border-blue-400
                focus:ring-blue-100
              `
              : `
                border-red-300
                focus:border-red-400
                focus:ring-red-100
              `
          )}
        />

        {!isTitleValid && (
          <p
            className="
              text-xs
              font-medium
              text-red-600
            "
          >
            Task title is required.
          </p>
        )}
      </div>

      {/* ====================================================================
          Description
      ==================================================================== */}

      <div className="space-y-2">
        <label
          htmlFor="task-description"
          className="
            block
            text-xs
            font-semibold
            text-slate-700
          "
        >
          Description
        </label>

        <textarea
          id="task-description"
          value={description}
          onChange={
            handleDescriptionChange
          }
          disabled={loading}
          rows={5}
          maxLength={2000}
          placeholder="Enter task description"
          className="
            w-full
            resize-y
            rounded-lg
            border
            border-slate-200
            bg-white
            px-3
            py-2.5
            text-sm
            leading-5
            text-slate-800
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-blue-400
            focus:ring-2
            focus:ring-blue-100
            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-500
          "
        />

        <div
          className="
            flex
            justify-end
          "
        >
          <span
            className="
              text-[11px]
              text-slate-400
            "
          >
            {description.length}/2000
          </span>
        </div>
      </div>

      {/* ====================================================================
          Priority + Status
      ==================================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          md:grid-cols-2
        "
      >
        {/* Priority */}

        <div className="space-y-2">
          <label
            htmlFor="task-priority"
            className="
              block
              text-xs
              font-semibold
              text-slate-700
            "
          >
            Priority
          </label>

          <select
            id="task-priority"
            value={priority}
            onChange={
              handlePriorityChange
            }
            disabled={loading}
            className="
              w-full
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-800
              outline-none
              transition
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-500
            "
          >
            <option
              value={
                TASK_PRIORITY.LOW
              }
            >
              Low
            </option>

            <option
              value={
                TASK_PRIORITY.MEDIUM
              }
            >
              Medium
            </option>

            <option
              value={
                TASK_PRIORITY.HIGH
              }
            >
              High
            </option>
          </select>
        </div>

        {/* Status */}

        <div className="space-y-2">
          <label
            htmlFor="task-status"
            className="
              block
              text-xs
              font-semibold
              text-slate-700
            "
          >
            Status
          </label>

          <select
            id="task-status"
            value={status}
            onChange={
              handleStatusChange
            }
            disabled={loading}
            className="
              w-full
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-800
              outline-none
              transition
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-500
            "
          >
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
        </div>
      </div>

      {/* ====================================================================
          Due Date + Assigned To
      ==================================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-5
          md:grid-cols-2
        "
      >
        {/* Due Date */}

        <div className="space-y-2">
          <label
            htmlFor="task-due-date"
            className="
              flex
              items-center
              gap-1.5
              text-xs
              font-semibold
              text-slate-700
            "
          >
            <CalendarDays
              size={14}
              className="text-slate-500"
            />

            Due Date
          </label>

          <input
            id="task-due-date"
            type="date"
            value={dueDate || ""}
            onChange={
              handleDueDateChange
            }
            disabled={loading}
            className="
              w-full
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-800
              outline-none
              transition
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-500
            "
          />
        </div>

        {/* Assigned To */}

        <div className="space-y-2">
          <label
            htmlFor="task-assigned-to"
            className="
              flex
              items-center
              gap-1.5
              text-xs
              font-semibold
              text-slate-700
            "
          >
            <User
              size={14}
              className="text-slate-500"
            />

            Assigned To
          </label>

          <input
            id="task-assigned-to"
            type="text"
            value={assignedTo}
            onChange={
              handleAssignedToChange
            }
            disabled={loading}
            maxLength={150}
            placeholder="Enter assignee"
            autoComplete="off"
            className="
              w-full
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3
              py-2.5
              text-sm
              text-slate-800
              outline-none
              transition
              placeholder:text-slate-400
              focus:border-blue-400
              focus:ring-2
              focus:ring-blue-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-500
            "
          />
        </div>
      </div>

      {/* ====================================================================
          Status Information
      ==================================================================== */}

      {status ===
        TASK_STATUS.COMPLETED && (
        <div
          className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-green-200
            bg-green-50
            px-4
            py-3
          "
        >
          <CheckCircle2
            size={18}
            className="
              mt-0.5
              shrink-0
              text-green-600
            "
          />

          <div>
            <p
              className="
                text-xs
                font-semibold
                text-green-800
              "
            >
              Task marked as completed
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-green-700
              "
            >
              Saving this task with
              Completed status will mark
              the task as finished.
            </p>
          </div>
        </div>
      )}

      {status !==
        TASK_STATUS.COMPLETED &&
        dueDate &&
        new Date(dueDate) <
          new Date() && (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-amber-200
              bg-amber-50
              px-4
              py-3
            "
          >
            <AlertCircle
              size={18}
              className="
                mt-0.5
                shrink-0
                text-amber-600
              "
            />

            <div>
              <p
                className="
                  text-xs
                  font-semibold
                  text-amber-800
                "
              >
                Due date has passed
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-amber-700
                "
              >
                Consider updating the due
                date before saving.
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
          flex-col-reverse
          gap-2
          border-t
          border-slate-200
          pt-5
          sm:flex-row
          sm:items-center
          sm:justify-end
        "
      >
        {/* Cancel */}

        <button
          type="button"
          onClick={handleCancel}
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
          <X size={15} />

          Cancel
        </button>

        {/* Save */}

        <button
          type="submit"
          disabled={!canSave}
          className="
            inline-flex
            items-center
            justify-center
            gap-1.5
            rounded-lg
            bg-blue-600
            px-4
            py-2.5
            text-xs
            font-semibold
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {loading ? (
            <>
              <Loader2
                size={15}
                className="animate-spin"
              />

              Saving...
            </>
          ) : (
            <>
              <Save size={15} />

              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskDetailsEditForm.propTypes = {
  title: PropTypes.string,

  description:
    PropTypes.string,

  priority: PropTypes.oneOf([
    TASK_PRIORITY.LOW,
    TASK_PRIORITY.MEDIUM,
    TASK_PRIORITY.HIGH,
  ]),

  status: PropTypes.oneOf([
    TASK_STATUS.PENDING,
    TASK_STATUS.IN_PROGRESS,
    TASK_STATUS.COMPLETED,
  ]),

  dueDate: PropTypes.string,

  assignedTo:
    PropTypes.string,

  loading:
    PropTypes.bool,

  onTitleChange:
    PropTypes.func,

  onDescriptionChange:
    PropTypes.func,

  onPriorityChange:
    PropTypes.func,

  onStatusChange:
    PropTypes.func,

  onDueDateChange:
    PropTypes.func,

  onAssignedToChange:
    PropTypes.func,

  onCancel:
    PropTypes.func,

  onSave:
    PropTypes.func,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskDetailsEditForm.defaultProps = {
  title: "",

  description: "",

  priority:
    TASK_PRIORITY.MEDIUM,

  status:
    TASK_STATUS.PENDING,

  dueDate: "",

  assignedTo: "",

  loading: false,

  onTitleChange:
    undefined,

  onDescriptionChange:
    undefined,

  onPriorityChange:
    undefined,

  onStatusChange:
    undefined,

  onDueDateChange:
    undefined,

  onAssignedToChange:
    undefined,

  onCancel:
    undefined,

  onSave:
    undefined,
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskDetailsEditForm.displayName =
  "TaskDetailsEditForm";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskDetailsEditForm =
  memo(TaskDetailsEditForm);

MemoizedTaskDetailsEditForm.displayName =
  "MemoizedTaskDetailsEditForm";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskDetailsEditForm;
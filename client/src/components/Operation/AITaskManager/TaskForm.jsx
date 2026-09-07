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
  CalendarDays,
  Flag,
  User,
  FileText,
  Save,
  X,
} from "lucide-react";

/* ==========================================================================
   Enterprise Constants
   ========================================================================== */

const DEFAULT_PRIORITY = "medium";
const DEFAULT_STATUS = "pending";

const PRIORITIES = [
  {
    id: "low",
    label: "Low",
  },
  {
    id: "medium",
    label: "Medium",
  },
  {
    id: "high",
    label: "High",
  },
];

/* ==========================================================================
   Task Form
   ========================================================================== */

const TaskForm = ({
  initialTask = null,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Create Task",
  className = "",
}) => {
      /* ==========================================================================
     State
     ========================================================================== */

  const [title, setTitle] = useState(
    initialTask?.title || ""
  );

  const [description, setDescription] =
    useState(
      initialTask?.description || ""
    );

  const [priority, setPriority] =
    useState(
      initialTask?.priority ||
        DEFAULT_PRIORITY
    );

  const [dueDate, setDueDate] =
    useState(
      initialTask?.dueDate || ""
    );

  const [assignedTo, setAssignedTo] =
    useState(
      initialTask?.assignedTo || ""
    );

  /* ==========================================================================
     Edit Mode
     ========================================================================== */

  const isEditMode = useMemo(() => {
    return Boolean(initialTask);
  }, [initialTask]);

  /* ==========================================================================
     Validation
     ========================================================================== */

  const isValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      title.trim().length <= 200
    );
  }, [title]);

  const submitDisabled =
    loading || !isValid;

  /* ==========================================================================
     Sync Initial Task
     ========================================================================== */

  useEffect(() => {
    if (!initialTask) return;

    setTitle(initialTask.title || "");

    setDescription(
      initialTask.description || ""
    );

    setPriority(
      initialTask.priority ||
        DEFAULT_PRIORITY
    );

    setDueDate(
      initialTask.dueDate || ""
    );

    setAssignedTo(
      initialTask.assignedTo || ""
    );
  }, [initialTask]);

  /* ==========================================================================
     Submit
     ========================================================================== */

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (submitDisabled) return;

      const taskData = {
        ...(initialTask || {}),

        title: title.trim(),

        description:
          description.trim(),

        priority,

        status:
          initialTask?.status ||
          DEFAULT_STATUS,

        dueDate:
          dueDate || null,

        assignedTo:
          assignedTo.trim() || null,
      };

      onSubmit?.(taskData);
    },
    [
      submitDisabled,
      initialTask,
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      onSubmit,
    ]
  );

  /* ==========================================================================
     Cancel
     ========================================================================== */

  const handleCancel = useCallback(() => {
    if (loading) return;

    onCancel?.();
  }, [loading, onCancel]);
    /* ==========================================================================
     Render
     ========================================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      {/* ================================================================
          Header
          ================================================================ */}

      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {isEditMode
              ? "Edit Task"
              : "Create Task"}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {isEditMode
              ? "Update task details"
              : "Add a new task"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="
            rounded-lg
            p-2
            text-slate-400
            transition
            hover:bg-slate-200
            hover:text-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          aria-label="Close task form"
        >
          <X size={18} />
        </button>

      </div>

      {/* ================================================================
          Form Body
          ================================================================ */}

      <div className="space-y-5 p-6">

        {/* Title */}

        <div>
          <label
            htmlFor="task-form-title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Task Title
          </label>

          <div className="relative">

            <FileText
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              id="task-form-title"
              type="text"
              value={title}
              maxLength={200}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Enter task title..."
              disabled={loading}
              className="
                w-full rounded-lg
                border border-slate-300
                bg-white
                py-2.5 pl-10 pr-4
                text-sm text-slate-700
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
                disabled:bg-slate-50
              "
            />

          </div>
        </div>

        {/* Description */}

        <div>
          <label
            htmlFor="task-form-description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>

          <textarea
            id="task-form-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Describe the task..."
            rows={4}
            disabled={loading}
            className="
              w-full resize-none rounded-lg
              border border-slate-300
              bg-white
              px-4 py-3
              text-sm text-slate-700
              outline-none
              transition
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:bg-slate-50
            "
          />
        </div>

        {/* Priority */}

        <div>
          <label
            htmlFor="task-form-priority"
            className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <Flag size={15} />
            Priority
          </label>

          <select
            id="task-form-priority"
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value
              )
            }
            disabled={loading}
            className="
              w-full rounded-lg
              border border-slate-300
              bg-white
              px-4 py-2.5
              text-sm text-slate-700
              outline-none
              focus:border-blue-500
            "
          >
            {PRIORITIES.map(
              (item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.label}
                </option>
              )
            )}
          </select>
        </div>

        {/* Due Date + Assigned To */}

        <div className="grid gap-5 md:grid-cols-2">

          <div>
            <label
              htmlFor="task-form-due-date"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <CalendarDays size={15} />
              Due Date
            </label>

            <input
              id="task-form-due-date"
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
              disabled={loading}
              className="
                w-full rounded-lg
                border border-slate-300
                bg-white
                px-4 py-2.5
                text-sm text-slate-700
                outline-none
                focus:border-blue-500
              "
            />
          </div>

          <div>
            <label
              htmlFor="task-form-assigned-to"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              <User size={15} />
              Assign To
            </label>

            <input
              id="task-form-assigned-to"
              type="text"
              value={assignedTo}
              onChange={(event) =>
                setAssignedTo(
                  event.target.value
                )
              }
              placeholder="Employee / team member"
              disabled={loading}
              className="
                w-full rounded-lg
                border border-slate-300
                bg-white
                px-4 py-2.5
                text-sm text-slate-700
                outline-none
                focus:border-blue-500
              "
            />
          </div>

        </div>

      </div>
            {/* ================================================================
          Footer Actions
          ================================================================ */}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-slate-300
            bg-white
            px-5
            py-2.5
            text-sm
            font-medium
            text-slate-700
            transition-all
            duration-200
            hover:border-slate-400
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X size={16} />

          Cancel
        </button>

        <button
          type="submit"
          disabled={submitDisabled}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-lg
            bg-blue-600
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            transition-all
            duration-200
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:bg-slate-300
          "
        >
          <Save size={16} />

          {loading
            ? "Saving..."
            : submitLabel}
        </button>

      </div>

    </form>
  );
};
/* ==========================================================================
   PropTypes
   ========================================================================== */

TaskForm.propTypes = {
  /**
   * Existing task used when editing a task.
   */
  initialTask: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    _id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),

    title: PropTypes.string,

    description: PropTypes.string,

    priority: PropTypes.oneOf([
      "low",
      "medium",
      "high",
    ]),

    status: PropTypes.string,

    dueDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),

    assignedTo: PropTypes.string,
  }),

  /**
   * Called when the form is submitted.
   */
  onSubmit: PropTypes.func,

  /**
   * Called when the form is cancelled.
   */
  onCancel: PropTypes.func,

  /**
   * Shows saving/loading state.
   */
  loading: PropTypes.bool,

  /**
   * Submit button label.
   */
  submitLabel: PropTypes.string,

  /**
   * Additional Tailwind/CSS classes.
   */
  className: PropTypes.string,
};

/* ==========================================================================
   Default Props
   ========================================================================== */

TaskForm.defaultProps = {
  initialTask: null,

  onSubmit: undefined,

  onCancel: undefined,

  loading: false,

  submitLabel: "Create Task",

  className: "",
};
/* ==========================================================================
   Display Name
   ========================================================================== */

TaskForm.displayName =
  "TaskForm";

/* ==========================================================================
   Memoized Export
   ========================================================================== */

const MemoizedTaskForm = memo(
  TaskForm
);

MemoizedTaskForm.displayName =
  "MemoizedTaskForm";

/* ==========================================================================
   Default Export
   ========================================================================== */

export default MemoizedTaskForm;
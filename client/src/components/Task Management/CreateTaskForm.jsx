import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  CalendarDays,
  Save,
  X,
} from "lucide-react";

/* ==========================================================================
   Constants
========================================================================== */

const TASK_STATUS = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: TASK_PRIORITY.MEDIUM,
  status: TASK_STATUS.PENDING,
  dueDate: "",
  assignedTo: "",
};

/* ==========================================================================
   Field Styles
========================================================================== */

const INPUT_CLASS = `
  w-full
  rounded-lg
  border
  border-slate-300
  bg-white
  px-3
  py-2.5
  text-sm
  text-slate-800
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-100
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:text-slate-500
`;

const LABEL_CLASS = `
  mb-1.5
  block
  text-xs
  font-semibold
  text-slate-700
`;

/* ==========================================================================
   Create Task Form
========================================================================== */

const CreateTaskForm = ({
  loading = false,
  onSave,
  onCancel,
}) => {
  /* ==========================================================================
     State
  ========================================================================== */

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [submitted, setSubmitted] =
    useState(false);

  /* ==========================================================================
     Derived State
  ========================================================================== */

  const titleValid =
    Boolean(form.title.trim());

  const canSave =
    titleValid && !loading;

  /* ==========================================================================
     Options
  ========================================================================== */

  const priorityOptions = useMemo(
    () => [
      {
        value: TASK_PRIORITY.LOW,
        label: "Low",
      },
      {
        value: TASK_PRIORITY.MEDIUM,
        label: "Medium",
      },
      {
        value: TASK_PRIORITY.HIGH,
        label: "High",
      },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      {
        value: TASK_STATUS.PENDING,
        label: "Pending",
      },
      {
        value: TASK_STATUS.IN_PROGRESS,
        label: "In Progress",
      },
      {
        value: TASK_STATUS.COMPLETED,
        label: "Completed",
      },
    ],
    []
  );

  /* ==========================================================================
     Generic Field Update
  ========================================================================== */

  const updateField = useCallback(
    (field, value) => {
      setForm(
        (current) => ({
          ...current,
          [field]: value,
        })
      );
    },
    []
  );

  /* ==========================================================================
     Handlers
  ========================================================================== */

  const handleTitleChange =
    useCallback(
      (event) => {
        updateField(
          "title",
          event.target.value
        );
      },
      [updateField]
    );

  const handleDescriptionChange =
    useCallback(
      (event) => {
        updateField(
          "description",
          event.target.value
        );
      },
      [updateField]
    );

  const handlePriorityChange =
    useCallback(
      (event) => {
        updateField(
          "priority",
          event.target.value
        );
      },
      [updateField]
    );

  const handleStatusChange =
    useCallback(
      (event) => {
        updateField(
          "status",
          event.target.value
        );
      },
      [updateField]
    );

  const handleDueDateChange =
    useCallback(
      (event) => {
        updateField(
          "dueDate",
          event.target.value
        );
      },
      [updateField]
    );

  const handleAssignedToChange =
    useCallback(
      (event) => {
        updateField(
          "assignedTo",
          event.target.value
        );
      },
      [updateField]
    );

  /* ==========================================================================
     Cancel
  ========================================================================== */

  const handleCancel = useCallback(() => {
    if (loading) {
      return;
    }

    onCancel?.();
  }, [
    loading,
    onCancel,
  ]);

  /* ==========================================================================
     Submit
  ========================================================================== */

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      setSubmitted(true);

      const trimmedTitle =
        form.title.trim();

      if (!trimmedTitle || loading) {
        return;
      }

      const payload = {
        title: trimmedTitle,

        description:
          form.description.trim(),

        priority:
          form.priority,

        status:
          form.status,

        dueDate:
          form.dueDate || null,

        assignedTo:
          form.assignedTo.trim() || null,
      };

      onSave?.(payload);
    },
    [
      form,
      loading,
      onSave,
    ]
  );

  /* ==========================================================================
     Render
  ========================================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex
        min-h-0
        flex-1
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* ====================================================================
          Header
      ==================================================================== */}

      <div
        className="
          shrink-0
          border-b
          border-slate-200
          px-6
          py-5
        "
      >
        <h2
          className="
            text-lg
            font-bold
            text-slate-900
          "
        >
          Create New Task
        </h2>

        <p
          className="
            mt-1
            text-xs
            text-slate-500
          "
        >
          Add the task information below
          and save it to your task list.
        </p>
      </div>

      {/* ====================================================================
          Form Body
      ==================================================================== */}

      <div
        className="
          flex-1
          overflow-y-auto
          px-6
          py-6
        "
      >
        {/* Title */}

        <div className="mb-5">
          <label
            htmlFor="create-task-title"
            className={LABEL_CLASS}
          >
            Task Title
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="create-task-title"
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            disabled={loading}
            placeholder="Enter task title"
            maxLength={200}
            autoComplete="off"
            autoFocus
            className={INPUT_CLASS}
          />

          {submitted &&
            !titleValid && (
              <p
                className="
                  mt-1.5
                  text-[11px]
                  font-medium
                  text-red-600
                "
              >
                Task title is required.
              </p>
            )}
        </div>

        {/* Description */}

        <div className="mb-5">
          <label
            htmlFor="create-task-description"
            className={LABEL_CLASS}
          >
            Description
          </label>

          <textarea
            id="create-task-description"
            value={form.description}
            onChange={
              handleDescriptionChange
            }
            disabled={loading}
            placeholder="Add task description"
            rows={5}
            maxLength={2000}
            className={clsx(
              INPUT_CLASS,
              "resize-y",
              "leading-6"
            )}
          />

          <div
            className="
              mt-1
              text-right
              text-[10px]
              text-slate-400
            "
          >
            {form.description.length}/2000
          </div>
        </div>

        {/* Priority + Status */}

        <div
          className="
            mb-5
            grid
            gap-4
            sm:grid-cols-2
          "
        >
          <div>
            <label
              htmlFor="create-task-priority"
              className={LABEL_CLASS}
            >
              Priority
            </label>

            <select
              id="create-task-priority"
              value={form.priority}
              onChange={
                handlePriorityChange
              }
              disabled={loading}
              className={INPUT_CLASS}
            >
              {priorityOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="create-task-status"
              className={LABEL_CLASS}
            >
              Status
            </label>

            <select
              id="create-task-status"
              value={form.status}
              onChange={
                handleStatusChange
              }
              disabled={loading}
              className={INPUT_CLASS}
            >
              {statusOptions.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Due Date */}

        <div className="mb-5">
          <label
            htmlFor="create-task-due-date"
            className={LABEL_CLASS}
          >
            Due Date
          </label>

          <div className="relative">
            <CalendarDays
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
              id="create-task-due-date"
              type="date"
              value={form.dueDate}
              onChange={
                handleDueDateChange
              }
              disabled={loading}
              className={clsx(
                INPUT_CLASS,
                "pl-9"
              )}
            />
          </div>
        </div>

        {/* Assigned To */}

        <div>
          <label
            htmlFor="create-task-assigned-to"
            className={LABEL_CLASS}
          >
            Assigned To
          </label>

          <input
            id="create-task-assigned-to"
            type="text"
            value={form.assignedTo}
            onChange={
              handleAssignedToChange
            }
            disabled={loading}
            placeholder="Enter assignee"
            maxLength={150}
            autoComplete="off"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      {/* ====================================================================
          Footer Actions
      ==================================================================== */}

      <div
        className="
          shrink-0
          border-t
          border-slate-200
          bg-white
          px-6
          py-4
        "
      >
        <div
          className="
            flex
            flex-col-reverse
            gap-2
            sm:flex-row
            sm:justify-end
          "
        >
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
              border-slate-300
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
            <X size={14} />

            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSave}
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-lg
              border
              border-blue-600
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
            <Save size={14} />

            {loading
              ? "Creating..."
              : "Create Task"}
          </button>
        </div>
      </div>
    </form>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

CreateTaskForm.propTypes = {
  loading:
    PropTypes.bool,

  onSave:
    PropTypes.func,

  onCancel:
    PropTypes.func,
};

/* ==========================================================================
   Default Props
========================================================================== */

CreateTaskForm.defaultProps = {
  loading: false,
  onSave: undefined,
  onCancel: undefined,
};

/* ==========================================================================
   Display Name
========================================================================== */

CreateTaskForm.displayName =
  "CreateTaskForm";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedCreateTaskForm =
  memo(CreateTaskForm);

MemoizedCreateTaskForm.displayName =
  "MemoizedCreateTaskForm";

/* ==========================================================================
   Export
========================================================================== */

export default MemoizedCreateTaskForm;
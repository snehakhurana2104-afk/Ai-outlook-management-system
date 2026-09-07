import React, {
  memo,
  useCallback,
  useMemo,
  useState,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Plus,
  X,
  Sparkles,
  CalendarDays,
  Flag,
  User,
  FileText,
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
   Create Task
   ========================================================================== */

const CreateTask = ({
  onCreate,
  onCancel,
  loading = false,
  className = "",
}) => {
  /* ==========================================================================
     State
     ========================================================================== */

  const [title, setTitle] = useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState(DEFAULT_PRIORITY);

  const [dueDate, setDueDate] =
    useState("");

  const [assignedTo, setAssignedTo] =
    useState("");

  /* ==========================================================================
     Derived State
     ========================================================================== */

  const isValid = useMemo(() => {
    return title.trim().length > 0;
  }, [title]);

  const submitDisabled =
    loading || !isValid;
      /* ==========================================================================
     Submit Handler
     ========================================================================== */

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (submitDisabled) {
        return;
      }

      const task = {
        title: title.trim(),

        description:
          description.trim(),

        priority,

        status: DEFAULT_STATUS,

        dueDate:
          dueDate || null,

        assignedTo:
          assignedTo.trim() || null,

        createdAt:
          new Date().toISOString(),
      };

      onCreate?.(task);
    },
    [
      submitDisabled,
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      onCreate,
    ]
  );

  /* ==========================================================================
     Cancel Handler
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
     Render
     ========================================================================== */

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(
        "rounded-xl border border-slate-200",
        "bg-white shadow-sm",
        className
      )}
    >
      {/* ================================================================
          Header
          ================================================================ */}

      <div className="
        flex items-center justify-between
        border-b border-slate-200
        bg-slate-50
        px-5 py-4
      ">

        <div className="flex items-center gap-3">

          <div className="
            flex h-10 w-10
            items-center justify-center
            rounded-lg
            bg-blue-100
            text-blue-600
          ">
            <Sparkles size={19} />
          </div>

          <div>

            <h3 className="
              text-sm
              font-semibold
              text-slate-900
            ">
              Create AI Task
            </h3>

            <p className="
              mt-1
              text-xs
              text-slate-500
            ">
              Create a new task manually
            </p>

          </div>

        </div>

        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          aria-label="Close create task"
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
            htmlFor="task-title"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-700
            "
          >
            Task Title
          </label>

          <div className="relative">

            <FileText
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
              id="task-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Enter task title..."
              disabled={loading}
              maxLength={200}
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

        </div>

        {/* Description */}

        <div>

          <label
            htmlFor="task-description"
            className="
              mb-2
              block
              text-sm
              font-medium
              text-slate-700
            "
          >
            Description
          </label>

          <textarea
            id="task-description"
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
            placeholder="Describe the task..."
            rows={4}
            disabled={loading}
            maxLength={2000}
            className="
              w-full
              resize-none
              rounded-lg
              border border-slate-300
              bg-white
              px-4
              py-3
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
                {/* Priority */}

        <div>

          <label
            htmlFor="task-priority"
            className="
              mb-2
              flex
              items-center
              gap-2
              text-sm
              font-medium
              text-slate-700
            "
          >
            <Flag size={15} />

            Priority
          </label>

          <select
            id="task-priority"
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value
              )
            }
            disabled={loading}
            className="
              w-full
              rounded-lg
              border border-slate-300
              bg-white
              px-4
              py-2.5
              text-sm
              text-slate-700
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
          >

            {PRIORITIES.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.label}
              </option>
            ))}

          </select>

        </div>

        {/* Due Date + Assigned To */}

        <div className="
          grid
          gap-5
          md:grid-cols-2
        ">

          {/* Due Date */}

          <div>

            <label
              htmlFor="task-due-date"
              className="
                mb-2
                flex
                items-center
                gap-2
                text-sm
                font-medium
                text-slate-700
              "
            >
              <CalendarDays size={15} />

              Due Date
            </label>

            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
              disabled={loading}
              className="
                w-full
                rounded-lg
                border border-slate-300
                bg-white
                px-4
                py-2.5
                text-sm
                text-slate-700
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />

          </div>

          {/* Assigned To */}

          <div>

            <label
              htmlFor="task-assigned-to"
              className="
                mb-2
                flex
                items-center
                gap-2
                text-sm
                font-medium
                text-slate-700
              "
            >
              <User size={15} />

              Assign To
            </label>

            <input
              id="task-assigned-to"
              type="text"
              value={assignedTo}
              onChange={(event) =>
                setAssignedTo(
                  event.target.value
                )
              }
              placeholder="Employee / team member"
              disabled={loading}
              maxLength={150}
              className="
                w-full
                rounded-lg
                border border-slate-300
                bg-white
                px-4
                py-2.5
                text-sm
                text-slate-700
                outline-none
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />

          </div>

        </div>

      </div>
            {/* ================================================================
          Footer Actions
          ================================================================ */}

      <div className="
        flex
        items-center
        justify-end
        gap-3
        border-t border-slate-200
        bg-slate-50
        px-6
        py-4
      ">

        {/* Cancel */}

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
            border border-slate-300
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

        {/* Create */}

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
          <Plus size={17} />

          {loading
            ? "Creating..."
            : "Create Task"}

        </button>

      </div>

    </form>
  );
};

/* ==========================================================================
   PropTypes
   ========================================================================== */

CreateTask.propTypes = {
  onCreate: PropTypes.func,

  onCancel: PropTypes.func,

  loading: PropTypes.bool,

  className: PropTypes.string,
};

/* ==========================================================================
   Default Props
   ========================================================================== */

CreateTask.defaultProps = {
  onCreate: undefined,

  onCancel: undefined,

  loading: false,

  className: "",
};

/* ==========================================================================
   Display Name
   ========================================================================== */

CreateTask.displayName =
  "CreateTask";

/* ==========================================================================
   Memoized Export
   ========================================================================== */

const MemoizedCreateTask =
  memo(CreateTask);

MemoizedCreateTask.displayName =
  "MemoizedCreateTask";

/* ==========================================================================
   Default Export
   ========================================================================== */

export default MemoizedCreateTask;
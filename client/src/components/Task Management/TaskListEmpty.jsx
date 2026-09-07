import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";

import {
  ListTodo,
  Plus,
  RefreshCw,
} from "lucide-react";

/* ==========================================================================
   Task List Empty State
========================================================================== */

const TaskListEmpty = ({
  loading = false,
  onCreateTask,
  onRefresh,
}) => {
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
     Render
  ========================================================================== */

  return (
    <div
      className="
        flex
        min-h-[280px]
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        border-dashed
        border-slate-300
        bg-slate-50/70
        px-6
        py-14
        text-center
      "
    >
      {/* ====================================================================
          Icon
      ==================================================================== */}

      <div
        className="
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          bg-white
          text-slate-400
          shadow-sm
          ring-1
          ring-slate-200
        "
      >
        <ListTodo size={28} />
      </div>

      {/* ====================================================================
          Title
      ==================================================================== */}

      <h3
        className="
          mt-5
          text-sm
          font-semibold
          text-slate-800
        "
      >
        {loading
          ? "Loading tasks..."
          : "No tasks available"}
      </h3>

      {/* ====================================================================
          Description
      ==================================================================== */}

      <p
        className="
          mt-1.5
          max-w-md
          text-xs
          leading-5
          text-slate-500
        "
      >
        {loading
          ? "Please wait while your tasks are being loaded."
          : "Tasks created through the AI Task Manager will appear here."}
      </p>

      {/* ====================================================================
          Actions
      ==================================================================== */}

      {!loading && (
        <div
          className="
            mt-5
            flex
            flex-wrap
            items-center
            justify-center
            gap-2
          "
        >
          {/* Create Task */}

          <button
            type="button"
            onClick={
              handleCreateTask
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              bg-blue-600
              px-3.5
              py-2
              text-xs
              font-semibold
              text-white
              shadow-sm
              transition-all
              duration-200
              hover:bg-blue-700
              hover:shadow
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:ring-offset-2
            "
          >
            <Plus size={15} />

            Create Task
          </button>

          {/* Refresh */}

          <button
            type="button"
            onClick={
              handleRefresh
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-slate-200
              bg-white
              px-3.5
              py-2
              text-xs
              font-medium
              text-slate-600
              transition-all
              duration-200
              hover:bg-slate-50
              hover:text-slate-800
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:ring-offset-2
            "
          >
            <RefreshCw size={14} />

            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskListEmpty.propTypes = {
  loading:
    PropTypes.bool,

  onCreateTask:
    PropTypes.func,

  onRefresh:
    PropTypes.func,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskListEmpty.defaultProps = {
  loading: false,

  onCreateTask:
    undefined,

  onRefresh:
    undefined,
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskListEmpty.displayName =
  "TaskListEmpty";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskListEmpty =
  memo(TaskListEmpty);

MemoizedTaskListEmpty.displayName =
  "MemoizedTaskListEmpty";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskListEmpty;
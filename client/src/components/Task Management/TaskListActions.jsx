import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  Plus,
  RefreshCw,
} from "lucide-react";

/* ==========================================================================
   Task List Actions
========================================================================== */

const TaskListActions = ({
  loading = false,
  onRefresh,
  onCreateTask,
  className = "",
}) => {
  const handleRefresh = useCallback(() => {
    if (loading) {
      return;
    }

    onRefresh?.();
  }, [loading, onRefresh]);

  const handleCreateTask = useCallback(() => {
    if (loading) {
      return;
    }

    onCreateTask?.();
  }, [loading, onCreateTask]);

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center justify-end gap-2",
        "border-b border-slate-200",
        "px-6 py-4",
        className
      )}
    >
      {/* ==================================================================
          Refresh
      ================================================================== */}

      <button
        type="button"
        disabled={loading}
        onClick={handleRefresh}
        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          border border-slate-200
          bg-white
          px-3 py-2
          text-xs
          font-medium
          text-slate-600
          transition-all
          duration-200
          hover:border-slate-300
          hover:bg-slate-50
          hover:text-slate-800
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <RefreshCw
          size={14}
          className={clsx(
            loading && "animate-spin"
          )}
        />

        {loading
          ? "Refreshing..."
          : "Refresh"}
      </button>

      {/* ==================================================================
          Create Task
      ================================================================== */}

      <button
        type="button"
        disabled={loading}
        onClick={handleCreateTask}
        className="
          inline-flex
          items-center
          gap-2
          rounded-lg
          bg-blue-600
          px-3.5 py-2
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
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <Plus size={15} />

        Create Task
      </button>
    </div>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskListActions.propTypes = {
  loading: PropTypes.bool,

  onRefresh:
    PropTypes.func,

  onCreateTask:
    PropTypes.func,

  className:
    PropTypes.string,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskListActions.defaultProps = {
  loading: false,

  onRefresh:
    undefined,

  onCreateTask:
    undefined,

  className: "",
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskListActions.displayName =
  "TaskListActions";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskListActions =
  memo(TaskListActions);

MemoizedTaskListActions.displayName =
  "MemoizedTaskListActions";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskListActions;
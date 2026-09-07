import React, {
  memo,
  useCallback,
} from "react";

import PropTypes from "prop-types";
import clsx from "clsx";

import {
  ListTodo,
  RefreshCw,
} from "lucide-react";

/* ==========================================================================
   Task List Header
========================================================================== */

const TaskListHeader = ({
  total = 0,
  loading = false,
  onRefresh,
  className = "",
}) => {
  const handleRefresh = useCallback(() => {
    if (loading) {
      return;
    }

    onRefresh?.();
  }, [loading, onRefresh]);

  return (
    <header
      className={clsx(
        "flex flex-col gap-4",
        "border-b border-slate-200",
        "px-6 py-5",
        "sm:flex-row",
        "sm:items-center",
        "sm:justify-between",
        className
      )}
    >
      {/* ====================================================================
          Title
      ==================================================================== */}

      <div className="flex min-w-0 items-center gap-3">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-blue-50
            text-blue-600
          "
        >
          <ListTodo size={20} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Task List
            </h2>

            <span
              className="
                rounded-full
                bg-slate-100
                px-2
                py-0.5
                text-[11px]
                font-semibold
                text-slate-600
              "
            >
              {Number(total) || 0}
            </span>
          </div>

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

      {/* ====================================================================
          Header Status / Refresh
      ==================================================================== */}

      <div className="flex items-center gap-3">
        {loading && (
          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              font-medium
              text-blue-600
            "
          >
            <span
              className="
                h-2
                w-2
                animate-pulse
                rounded-full
                bg-blue-600
              "
            />

            Updating...
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleRefresh}
          aria-label="Refresh tasks"
          title="Refresh tasks"
          className="
            inline-flex
            h-9
            w-9
            items-center
            justify-center
            rounded-lg
            border
            border-slate-200
            bg-white
            text-slate-500
            transition-all
            duration-200
            hover:border-slate-300
            hover:bg-slate-50
            hover:text-slate-700
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:ring-offset-1
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <RefreshCw
            size={15}
            className={clsx(
              loading &&
                "animate-spin"
            )}
          />
        </button>
      </div>
    </header>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskListHeader.propTypes = {
  total: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
  ]),

  loading:
    PropTypes.bool,

  onRefresh:
    PropTypes.func,

  className:
    PropTypes.string,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskListHeader.defaultProps = {
  total: 0,

  loading: false,

  onRefresh:
    undefined,

  className: "",
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskListHeader.displayName =
  "TaskListHeader";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskListHeader =
  memo(TaskListHeader);

MemoizedTaskListHeader.displayName =
  "MemoizedTaskListHeader";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskListHeader;
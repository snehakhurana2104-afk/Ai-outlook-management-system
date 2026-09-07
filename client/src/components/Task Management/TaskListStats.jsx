import React, { memo, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";

import {
  ListTodo,
  Clock3,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
} from "lucide-react";

/* ==========================================================================
   Task List Stats
========================================================================== */

const TaskListStats = ({
  stats = {},
  loading = false,
  className = "",
}) => {
  const normalizedStats = useMemo(
    () => ({
      total: Number(stats?.total) || 0,
      pending: Number(stats?.pending) || 0,
      inProgress:
        Number(stats?.inProgress) || 0,
      completed:
        Number(stats?.completed) || 0,
      onHold:
        Number(stats?.onHold) || 0,
      cancelled:
        Number(stats?.cancelled) || 0,
      overdue:
        Number(stats?.overdue) || 0,
    }),
    [stats]
  );

  const statItems = useMemo(
    () => [
      {
        key: "total",
        label: "Total",
        value: normalizedStats.total,
        icon: ListTodo,
        iconClass: "text-blue-600",
        iconBg: "bg-blue-50",
      },
      {
        key: "pending",
        label: "Pending",
        value: normalizedStats.pending,
        icon: Clock3,
        iconClass: "text-amber-600",
        iconBg: "bg-amber-50",
      },
      {
        key: "inProgress",
        label: "In Progress",
        value: normalizedStats.inProgress,
        icon: Clock3,
        iconClass: "text-blue-600",
        iconBg: "bg-blue-50",
      },
      {
        key: "completed",
        label: "Completed",
        value: normalizedStats.completed,
        icon: CheckCircle2,
        iconClass: "text-green-600",
        iconBg: "bg-green-50",
      },
      {
        key: "overdue",
        label: "Overdue",
        value: normalizedStats.overdue,
        icon: AlertCircle,
        iconClass: "text-red-600",
        iconBg: "bg-red-50",
      },
      {
        key: "onHold",
        label: "On Hold",
        value: normalizedStats.onHold,
        icon: PauseCircle,
        iconClass: "text-orange-600",
        iconBg: "bg-orange-50",
      },
      {
        key: "cancelled",
        label: "Cancelled",
        value: normalizedStats.cancelled,
        icon: XCircle,
        iconClass: "text-slate-500",
        iconBg: "bg-slate-100",
      },
    ],
    [normalizedStats]
  );

  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-3",
        "border-b border-slate-200",
        "px-6 py-4",
        "sm:grid-cols-3",
        "lg:grid-cols-4",
        "xl:grid-cols-7",
        className
      )}
    >
      {statItems.map(
        ({
          key,
          label,
          value,
          icon: Icon,
          iconClass,
          iconBg,
        }) => (
          <div
            key={key}
            className="
              rounded-xl
              border border-slate-200
              bg-slate-50
              p-3
              transition-all
              duration-200
              hover:bg-white
              hover:shadow-sm
            "
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                {label}
              </span>

              <span
                className={clsx(
                  "flex h-7 w-7",
                  "items-center justify-center",
                  "rounded-lg",
                  iconBg
                )}
              >
                <Icon
                  size={15}
                  className={iconClass}
                />
              </span>
            </div>

            <div className="mt-2">
              {loading ? (
                <div
                  className="
                    h-6
                    w-10
                    animate-pulse
                    rounded-md
                    bg-slate-200
                  "
                />
              ) : (
                <p
                  className="
                    text-xl
                    font-bold
                    tracking-tight
                    text-slate-900
                  "
                >
                  {value.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

/* ==========================================================================
   PropTypes
========================================================================== */

TaskListStats.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    pending: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    inProgress: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    completed: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    overdue: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    onHold: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),

    cancelled: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  }),

  loading: PropTypes.bool,

  className: PropTypes.string,
};

/* ==========================================================================
   Default Props
========================================================================== */

TaskListStats.defaultProps = {
  stats: {},
  loading: false,
  className: "",
};

/* ==========================================================================
   Display Name
========================================================================== */

TaskListStats.displayName =
  "TaskListStats";

/* ==========================================================================
   Memoized Export
========================================================================== */

const MemoizedTaskListStats =
  memo(TaskListStats);

MemoizedTaskListStats.displayName =
  "MemoizedTaskListStats";

/* ==========================================================================
   Default Export
========================================================================== */

export default MemoizedTaskListStats;
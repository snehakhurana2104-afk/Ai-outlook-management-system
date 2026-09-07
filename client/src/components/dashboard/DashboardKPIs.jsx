/******************************************************************************
 * DashboardKPIs.jsx
 * Part 1
 * Enterprise KPI Cards
 ******************************************************************************/

import React, { memo, useMemo } from "react";

import {
  Mail,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

/* ==========================================================================
   Helpers
========================================================================== */

const formatNumber = (value = 0) =>
  new Intl.NumberFormat().format(value);

const formatPercent = (value = 0) => `${value}%`;

/* ==========================================================================
   KPI Configuration
========================================================================== */

const KPI_CONFIG = {
  totalEmails: {
    title: "Total Emails",
    icon: Mail,
  },
  completed: {
    title: "Completed",
    icon: CheckCircle2,
  },
  pending: {
    title: "Pending",
    icon: Clock3,
  },
  highPriority: {
    title: "High Priority",
    icon: AlertTriangle,
  },
};

/* ==========================================================================
   Component
========================================================================== */

const DashboardKPIs = ({
  stats = {},
  completionRate = 0,
  connected = false,
  refreshing = false,
}) => {
    /* ========================================================================
     Derived KPI Data
  ========================================================================= */

  const totalEmails = stats?.totalEmails ?? 0;
  const completed = stats?.completed ?? 0;
  const pending = stats?.pending ?? 0;
  const highPriority = stats?.highPriority ?? 0;

  /* ========================================================================
     KPI Cards
  ========================================================================= */

  const kpis = useMemo(() => {
    return [
      {
        key: "totalEmails",
        title: KPI_CONFIG.totalEmails.title,
        value: totalEmails,
        icon: KPI_CONFIG.totalEmails.icon,
        trend: 12,
        trendLabel: "vs last period",
        color: "blue",
      },

      {
        key: "completed",
        title: KPI_CONFIG.completed.title,
        value: completed,
        icon: KPI_CONFIG.completed.icon,
        trend: completionRate,
        trendLabel: "Completion Rate",
        color: "green",
      },

      {
        key: "pending",
        title: KPI_CONFIG.pending.title,
        value: pending,
        icon: KPI_CONFIG.pending.icon,
        trend: pending === 0 ? 0 : -pending,
        trendLabel: "Pending Emails",
        color: "amber",
      },

      {
        key: "highPriority",
        title: KPI_CONFIG.highPriority.title,
        value: highPriority,
        icon: KPI_CONFIG.highPriority.icon,
        trend: highPriority > 0 ? -highPriority : 0,
        trendLabel: "Need Attention",
        color: "red",
      },
    ];
  }, [
    totalEmails,
    completed,
    pending,
    highPriority,
    completionRate,
  ]);

  /* ========================================================================
     Color Styles
  ========================================================================= */

  const colorStyles = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      ring: "ring-blue-100",
    },

    green: {
      bg: "bg-green-100",
      text: "text-green-600",
      ring: "ring-green-100",
    },

    amber: {
      bg: "bg-amber-100",
      text: "text-amber-600",
      ring: "ring-amber-100",
    },

    red: {
      bg: "bg-red-100",
      text: "text-red-600",
      ring: "ring-red-100",
    },
  };
    /* ========================================================================
     Trend Badge
  ========================================================================= */

  const TrendBadge = memo(({ value }) => {
    let Icon = Minus;
    let color = "text-gray-500 bg-gray-100";

    if (value > 0) {
      Icon = TrendingUp;
      color = "text-green-600 bg-green-100";
    }

    if (value < 0) {
      Icon = TrendingDown;
      color = "text-red-600 bg-red-100";
    }

    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${color}`}
      >
        <Icon size={14} />

        {Math.abs(value)}%
      </div>
    );
  });

  TrendBadge.displayName = "TrendBadge";

  /* ========================================================================
     Connection Status
  ========================================================================= */

  const StatusIndicator = memo(() => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
        connected
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {connected ? "LIVE" : "OFFLINE"}
    </span>
  ));

  StatusIndicator.displayName = "StatusIndicator";

  /* ========================================================================
     KPI Card
  ========================================================================= */

  const KPICard = memo(({ item }) => {
    const Icon = item.icon;
    const style = colorStyles[item.color];

    return (
      <div
        className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${style.ring}`}
      >
        {/* Header */}

        <div className="flex items-center justify-between">

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${style.bg}`}
          >
            <Icon
              size={24}
              className={style.text}
            />
          </div>

          <TrendBadge value={item.trend} />
        </div>

        {/* Value */}

        <div className="mt-5">

          <h3 className="text-sm font-medium text-gray-500">
            {item.title}
          </h3>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatNumber(item.value)}
          </p>

        </div>

        {/* Footer */}

        <div className="mt-5 flex items-center justify-between">

          <span className="text-xs text-gray-500">
            {item.trendLabel}
          </span>

          <StatusIndicator />

        </div>

      </div>
    );
  });

  KPICard.displayName = "KPICard";
    /* ========================================================================
     Render
  ========================================================================= */

  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">

      {kpis.map((item) => (
        <KPICard
          key={item.key}
          item={item}
        />
      ))}

      {/* Completion Summary */}

      <div className="col-span-1 sm:col-span-2 xl:col-span-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-lg font-semibold text-gray-900">
              Overall Completion Rate
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Percentage of completed work items
            </p>

          </div>

          <div className="text-right">

            <p className="text-4xl font-bold text-blue-600">
              {formatPercent(completionRate)}
            </p>

            {refreshing && (
              <p className="mt-1 text-xs text-gray-500">
                Refreshing dashboard...
              </p>
            )}

          </div>

        </div>

        {/* Progress Bar */}

        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-gray-200">

          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-700"
            style={{
              width: `${Math.min(completionRate, 100)}%`,
            }}
          />

        </div>

      </div>

    </section>
  );
};

DashboardKPIs.displayName = "DashboardKPIs";

export default memo(DashboardKPIs);
import React, {
  memo,
  useMemo,
  useCallback,
} from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  ReferenceLine,
} from "recharts";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  LineChart as LineChartIcon,
  Mail,
  PieChart as PieChartIcon,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";

/* ========================================================================== */
/*                              Enterprise Colors                             */
/* ========================================================================== */

const COLORS = {
  primary: "#2563EB",
  secondary: "#7C3AED",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#06B6D4",

  slate: "#64748B",
  gray: "#94A3B8",

  border: "#E2E8F0",
  grid: "#E5E7EB",

  background: "#FFFFFF",

  pie: [
    "#2563EB",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#06B6D4",
    "#EC4899",
    "#14B8A6",
  ],
};

/* ========================================================================== */
/*                              Chart Dimensions                              */
/* ========================================================================== */

const CHART_HEIGHT = 360;

const PIE_CHART_HEIGHT = 360;

const BAR_CHART_HEIGHT = 380;

const COMPANY_CHART_HEIGHT = 420;

const PRODUCTIVITY_HEIGHT = 400;

/* ========================================================================== */
/*                             Grid Configuration                             */
/* ========================================================================== */

const GRID_STYLE = {
  stroke: "#E5E7EB",
  strokeDasharray: "3 3",
};

/* ========================================================================== */
/*                            Animation Defaults                              */
/* ========================================================================== */

const ANIMATION = {
  duration: 900,
  begin: 0,
};

/* ========================================================================== */
/*                              Chart Metadata                                */
/* ========================================================================== */

const CHARTS = {
  emailTrend: {
    title: "Email Trend",
    subtitle: "Daily email activity",
    icon: LineChartIcon,
  },

  priority: {
    title: "Priority Distribution",
    subtitle: "Priority breakdown",
    icon: PieChartIcon,
  },

  category: {
    title: "Category Analysis",
    subtitle: "Email category performance",
    icon: BarChart3,
  },

  company: {
    title: "Top Companies",
    subtitle: "Company-wise email volume",
    icon: Building2,
  },

  productivity: {
    title: "Productivity Trend",
    subtitle: "Team productivity over time",
    icon: TrendingUp,
  },
};

/* ========================================================================== */
/*                          Empty Default Datasets                            */
/* ========================================================================== */

const EMPTY_LINE_DATA = [];

const EMPTY_PIE_DATA = [];

const EMPTY_BAR_DATA = [];

const EMPTY_COMPANY_DATA = [];

const EMPTY_PRODUCTIVITY = [];
/* ========================================================================== */
/*                         Enterprise Helper Functions                        */
/* ========================================================================== */

/**
 * Safe Number
 */
export const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

/**
 * Number Formatter
 */
export const formatNumber = (
  value,
  locale = "en-IN"
) => {
  return new Intl.NumberFormat(locale).format(
    safeNumber(value)
  );
};

/**
 * Currency Formatter
 */
export const formatCurrency = (
  value,
  currency = "INR",
  locale = "en-IN"
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(safeNumber(value));
};

/**
 * Percentage Formatter
 */
export const formatPercent = (
  value,
  digits = 0
) => {
  return `${safeNumber(value).toFixed(digits)}%`;
};

/**
 * Minutes Formatter
 */
export const formatMinutes = (value) => {
  return `${formatNumber(value)} min`;
};

/**
 * Hours Formatter
 */
export const formatHours = (value) => {
  return `${formatNumber(value)} hrs`;
};

/**
 * Compact Number
 */
export const formatCompact = (value) => {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(safeNumber(value));
};

/* ========================================================================== */
/*                             Date Formatting                                */
/* ========================================================================== */

export const formatDate = (
  value,
  locale = "en-IN"
) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(
    locale,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

export const formatTime = (
  value,
  locale = "en-IN"
) => {
  if (!value) return "-";

  return new Date(value).toLocaleTimeString(
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
};

export const formatDateTime = (
  value,
  locale = "en-IN"
) => {
  if (!value) return "-";

  return new Date(value).toLocaleString(
    locale,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

/* ========================================================================== */
/*                           Trend Helper Methods                             */
/* ========================================================================== */

export const isPositiveTrend = (
  trend = 0
) => trend >= 0;

export const getTrendColor = (
  trend = 0
) =>
  trend >= 0
    ? "text-green-600"
    : "text-red-600";

export const getTrendBackground = (
  trend = 0
) =>
  trend >= 0
    ? "bg-green-100"
    : "bg-red-100";

export const getTrendStroke = (
  trend = 0
) =>
  trend >= 0
    ? COLORS.success
    : COLORS.danger;

export const getTrendIcon = (
  trend = 0
) =>
  trend >= 0
    ? TrendingUp
    : AlertTriangle;

/* ========================================================================== */
/*                            Array/Data Helpers                              */
/* ========================================================================== */

export const ensureArray = (
  value
) => (
  Array.isArray(value)
    ? value
    : []
);

export const hasData = (
  data
) =>
  Array.isArray(data) &&
  data.length > 0;

export const sumByKey = (
  data = [],
  key
) =>
  ensureArray(data).reduce(
    (sum, item) =>
      sum + safeNumber(item?.[key]),
    0
  );

export const averageByKey = (
  data = [],
  key
) => {
  if (!hasData(data)) return 0;

  return (
    sumByKey(data, key) /
    data.length
  );
};

export const maxByKey = (
  data = [],
  key
) =>
  Math.max(
    ...ensureArray(data).map(
      (item) =>
        safeNumber(item?.[key])
    ),
    0
  );

/* ========================================================================== */
/*                           Progress Helpers                                 */
/* ========================================================================== */

export const clampProgress = (
  value
) =>
  Math.min(
    Math.max(
      safeNumber(value),
      0
    ),
    100
  );

export const progressColor = (
  value
) => {
  const progress =
    clampProgress(value);

  if (progress >= 80)
    return COLORS.success;

  if (progress >= 50)
    return COLORS.warning;

  return COLORS.danger;
};

/* ========================================================================== */
/*                         Enterprise Chart Helpers                           */
/* ========================================================================== */

export const chartValue = (
  value
) =>
  safeNumber(value);

export const chartLabel = (
  value
) =>
  value ?? "-";

export const generateId = (
  prefix = "chart"
) =>
  `${prefix}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
    /* ========================================================================== */
/*                     Empty Data + Default Configuration                      */
/* ========================================================================== */

/**
 * Empty Chart Data
 */

export const EMPTY_EMAIL_TREND = [];

export const EMPTY_PRIORITY_DATA = [];

export const EMPTY_CATEGORY_DATA = [];

export const EMPTY_COMPANY_DATA = [];

export const EMPTY_PRODUCTIVITY_DATA = [];

/* ========================================================================== */
/*                             Chart Margins                                  */
/* ========================================================================== */

export const DEFAULT_MARGIN = {
  top: 20,
  right: 30,
  left: 10,
  bottom: 20,
};

export const PIE_MARGIN = {
  top: 10,
  right: 10,
  left: 10,
  bottom: 10,
};

export const HORIZONTAL_MARGIN = {
  top: 10,
  right: 30,
  left: 40,
  bottom: 10,
};

/* ========================================================================== */
/*                              Chart Radius                                  */
/* ========================================================================== */

export const PIE_RADIUS = {
  innerRadius: 70,
  outerRadius: 110,
};

export const ACTIVE_PIE_RADIUS = {
  innerRadius: 72,
  outerRadius: 118,
};

export const BAR_RADIUS = [8, 8, 0, 0];

export const HORIZONTAL_BAR_RADIUS = [0, 8, 8, 0];

/* ========================================================================== */
/*                          Enterprise Animation                              */
/* ========================================================================== */

export const DEFAULT_ANIMATION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 900,
  animationEasing: "ease-out",
};

export const STAGGER_ANIMATION = {
  first: 0,
  second: 150,
  third: 300,
  fourth: 450,
};

/* ========================================================================== */
/*                            Grid Configuration                              */
/* ========================================================================== */

export const DEFAULT_GRID = {
  stroke: COLORS.grid,
  strokeDasharray: "3 3",
  vertical: false,
};

export const DEFAULT_AXIS = {
  tickLine: false,
  axisLine: false,
  fontSize: 12,
  stroke: COLORS.slate,
};

export const DEFAULT_TOOLTIP = {
  cursor: {
    stroke: COLORS.primary,
    strokeDasharray: "4 4",
  },
};

/* ========================================================================== */
/*                         Empty / Loading Defaults                           */
/* ========================================================================== */

export const DEFAULT_LOADING_TEXT =
  "Loading analytics...";

export const DEFAULT_EMPTY_TITLE =
  "No analytics available";

export const DEFAULT_EMPTY_DESCRIPTION =
  "There is currently no data available for the selected filters.";

export const DEFAULT_ERROR_TITLE =
  "Unable to load analytics";

export const DEFAULT_ERROR_DESCRIPTION =
  "Please try refreshing the dashboard.";

/* ========================================================================== */
/*                        Enterprise Chart Layout                             */
/* ========================================================================== */

export const GRID_LAYOUT = {
  gap: 24,
  columns: {
    mobile: 1,
    tablet: 2,
    desktop: 2,
    wide: 12,
  },
};

export const CARD_STYLE = `
rounded-2xl
border
border-slate-200
bg-white
shadow-sm
transition-all
duration-300
hover:shadow-lg
`;

/* ========================================================================== */
/*                           Refresh Configuration                            */
/* ========================================================================== */

export const REFRESH_INTERVAL = 30000;

export const MAX_COMPANIES = 10;

export const MAX_CATEGORIES = 8;

export const DEFAULT_DECIMALS = 0;

/* ========================================================================== */
/*                        Enterprise Status Labels                            */
/* ========================================================================== */

export const STATUS = {
  LIVE: "Live",
  OFFLINE: "Offline",
  LOADING: "Loading",
  ERROR: "Error",
  READY: "Ready",
};

/* ========================================================================== */
/*                        Enterprise Empty Objects                            */
/* ========================================================================== */

export const DEFAULT_EXECUTIVE_ANALYTICS = {
  productivity: 0,
  productivityTrend: 0,
  responseTime: 0,
  responseTrend: 0,
  completionRate: 0,
  completionTrend: 0,
  highPriority: 0,
  priorityTrend: 0,
};

export const DEFAULT_AI_INSIGHTS = {
  aiScore: 0,
  outlookHealth: "Unknown",
  summary: {},
  recommendations: [],
  alerts: [],
  generatedAt: null,
};
/* ========================================================================== */
/*                    Enterprise Chart Configuration Objects                   */
/* ========================================================================== */

/**
 * Email Trend Line Chart
 */
export const EMAIL_TREND_CONFIG = {
  id: "emailTrend",

  title: "Email Trend",

  subtitle: "Daily email traffic",

  icon: LineChartIcon,

  height: CHART_HEIGHT,

  xKey: "date",

  lines: [
    {
      key: "emails",
      name: "Emails",
      color: COLORS.primary,
      strokeWidth: 3,
      dot: true,
      activeDot: true,
    },

    {
      key: "completed",
      name: "Completed",
      color: COLORS.success,
      strokeWidth: 2,
      dot: false,
    },

    {
      key: "pending",
      name: "Pending",
      color: COLORS.warning,
      strokeWidth: 2,
      dot: false,
    },
  ],
};

/* ========================================================================== */
/*                        Priority Distribution Pie                           */
/* ========================================================================== */

export const PRIORITY_CHART_CONFIG = {
  id: "priority",

  title: "Priority Distribution",

  subtitle: "Email priority breakdown",

  icon: PieChartIcon,

  height: PIE_CHART_HEIGHT,

  nameKey: "name",

  valueKey: "value",

  innerRadius: PIE_RADIUS.innerRadius,

  outerRadius: PIE_RADIUS.outerRadius,

  activeOuterRadius:
    ACTIVE_PIE_RADIUS.outerRadius,

  colors: [
    COLORS.danger,
    COLORS.warning,
    COLORS.success,
    COLORS.secondary,
    COLORS.info,
  ],
};

/* ========================================================================== */
/*                        Category Analysis Bar Chart                         */
/* ========================================================================== */

export const CATEGORY_BAR_CONFIG = {
  id: "category",

  title: "Category Analysis",

  subtitle: "Email category statistics",

  icon: BarChart3,

  height: BAR_CHART_HEIGHT,

  xKey: "category",

  bars: [
    {
      key: "emails",
      name: "Emails",
      color: COLORS.primary,
    },

    {
      key: "completed",
      name: "Completed",
      color: COLORS.success,
    },

    {
      key: "pending",
      name: "Pending",
      color: COLORS.warning,
    },
  ],
};

/* ========================================================================== */
/*                    Company Performance Horizontal Bar                      */
/* ========================================================================== */

export const COMPANY_PERFORMANCE_CONFIG = {
  id: "companies",

  title: "Top Companies",

  subtitle: "Company-wise email volume",

  icon: Building2,

  height: COMPANY_CHART_HEIGHT,

  layout: "vertical",

  xKey: "company",

  bar: {
    key: "emails",

    color: COLORS.secondary,

    radius: HORIZONTAL_BAR_RADIUS,
  },

  maxCompanies: MAX_COMPANIES,
};

/* ========================================================================== */
/*                    Productivity Trend Area Chart                           */
/* ========================================================================== */

export const PRODUCTIVITY_CONFIG = {
  id: "productivity",

  title: "Productivity Trend",

  subtitle: "Team productivity analytics",

  icon: TrendingUp,

  height: PRODUCTIVITY_HEIGHT,

  xKey: "date",

  referenceLine: {
    key: "average",
    label: "Average Productivity",
    color: COLORS.warning,
  },

  areas: [
    {
      key: "productivity",
      name: "Productivity",
      stroke: COLORS.primary,
      fill: "url(#productivityGradient)",
    },

    {
      key: "completed",
      name: "Completed",
      stroke: COLORS.success,
      fill: "url(#completedGradient)",
    },

    {
      key: "pending",
      name: "Pending",
      stroke: COLORS.warning,
      fill: "url(#pendingGradient)",
    },
  ],
};

/* ========================================================================== */
/*                    Enterprise Shared Chart Settings                        */
/* ========================================================================== */

export const SHARED_CHART_CONFIG = {
  margin: DEFAULT_MARGIN,

  grid: DEFAULT_GRID,

  axis: DEFAULT_AXIS,

  animation: DEFAULT_ANIMATION,

  tooltip: DEFAULT_TOOLTIP,

  responsive: true,

  debounce: 150,

  syncId: "dashboardCharts",
};

/* ========================================================================== */
/*                        Exportable Chart Registry                           */
/* ========================================================================== */

export const CHART_CONFIG = {
  emailTrend: EMAIL_TREND_CONFIG,

  priority: PRIORITY_CHART_CONFIG,

  category: CATEGORY_BAR_CONFIG,

  company: COMPANY_PERFORMANCE_CONFIG,

  productivity: PRODUCTIVITY_CONFIG,
};
/* ========================================================================== */
/*                          Enterprise Shared Config                          */
/* ========================================================================== */

export const CHART_THEME = {
  colors: COLORS,

  dimensions: {
    chart: CHART_HEIGHT,
    pie: PIE_CHART_HEIGHT,
    bar: BAR_CHART_HEIGHT,
    company: COMPANY_CHART_HEIGHT,
    productivity: PRODUCTIVITY_HEIGHT,
  },

  margin: DEFAULT_MARGIN,

  grid: DEFAULT_GRID,

  axis: DEFAULT_AXIS,

  animation: DEFAULT_ANIMATION,

  tooltip: DEFAULT_TOOLTIP,
};

/* ========================================================================== */
/*                          Enterprise Defaults                               */
/* ========================================================================== */

export const CHART_DEFAULTS = {
  emailTrend: EMPTY_EMAIL_TREND,

  priority: EMPTY_PRIORITY_DATA,

  category: EMPTY_CATEGORY_DATA,

  company: EMPTY_COMPANY_DATA,

  productivity: EMPTY_PRODUCTIVITY_DATA,

  executive: DEFAULT_EXECUTIVE_ANALYTICS,

  aiInsights: DEFAULT_AI_INSIGHTS,
};

/* ========================================================================== */
/*                           Chart Registry                                   */
/* ========================================================================== */

export const DASHBOARD_CHARTS = [
  EMAIL_TREND_CONFIG,
  PRIORITY_CHART_CONFIG,
  CATEGORY_BAR_CONFIG,
  COMPANY_PERFORMANCE_CONFIG,
  PRODUCTIVITY_CONFIG,
];

/* ========================================================================== */
/*                           Dashboard Config                                 */
/* ========================================================================== */

export const DASHBOARD_CHART_CONFIG = {
  charts: CHART_CONFIG,

  theme: CHART_THEME,

  defaults: CHART_DEFAULTS,

  refreshInterval: REFRESH_INTERVAL,

  maxCompanies: MAX_COMPANIES,

  maxCategories: MAX_CATEGORIES,
};
/* ========================================================================== */
/*                      Enterprise Chart Skeleton                             */
/* ========================================================================== */

const ChartSkeleton = memo(
  ({
    title = "Loading Analytics...",
    height = CHART_HEIGHT,
  }) => {
    return (
      <div
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

          <div>

            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />

            <div className="mt-3 h-4 w-56 animate-pulse rounded bg-slate-100" />

          </div>

          <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />

        </div>

        {/* Chart */}

        <div
          className="flex items-center justify-center px-6 py-6"
          style={{
            height,
          }}
        >
          <div className="relative h-full w-full">

            <div className="absolute inset-0 animate-pulse rounded-xl bg-slate-100" />

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">

              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-t-md bg-slate-300"
                  style={{
                    width: 26,
                    height: `${70 + ((index % 5) * 28)}px`,
                  }}
                />
              ))}

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">

          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />

        </div>

      </div>
    );
  }
);

ChartSkeleton.displayName = "ChartSkeleton";

/* ========================================================================== */
/*                        Enterprise Empty State                              */
/* ========================================================================== */

const ChartEmptyState = memo(
  ({
    title = DEFAULT_EMPTY_TITLE,
    description = DEFAULT_EMPTY_DESCRIPTION,
    icon: Icon = BarChart3,
    action,
    actionLabel = "Refresh",
  }) => {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div
          className="flex flex-col items-center justify-center px-8 text-center"
          style={{
            minHeight: CHART_HEIGHT,
          }}
        >
          {/* Icon */}

          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">

            <Icon
              size={36}
              className="text-slate-400"
            />

          </div>

          {/* Title */}

          <h3 className="text-xl font-semibold text-slate-800">
            {title}
          </h3>

          {/* Description */}

          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            {description}
          </p>

          {/* Action */}

          {typeof action === "function" && (
            <button
              onClick={action}
              className="
                mt-8
                rounded-xl
                bg-blue-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition-all
                duration-200
                hover:bg-blue-700
                hover:shadow-lg
                active:scale-95
              "
            >
              {actionLabel}
            </button>
          )}

        </div>

      </div>
    );
  }
);

ChartEmptyState.displayName = "ChartEmptyState";
/* ========================================================================== */
/*                          Enterprise Error State                            */
/* ========================================================================== */

const ChartErrorState = memo(
  ({
    title = DEFAULT_ERROR_TITLE,
    description = DEFAULT_ERROR_DESCRIPTION,
    onRetry,
  }) => {
    return (
      <div className="rounded-2xl border border-red-200 bg-white shadow-sm">
        <div
          className="flex flex-col items-center justify-center px-8 text-center"
          style={{
            minHeight: CHART_HEIGHT,
          }}
        >
          {/* Error Icon */}

          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle
              size={36}
              className="text-red-600"
            />
          </div>

          {/* Title */}

          <h3 className="text-xl font-semibold text-slate-900">
            {title}
          </h3>

          {/* Description */}

          <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500">
            {description}
          </p>

          {/* Retry */}

          {typeof onRetry === "function" && (
            <button
              onClick={onRetry}
              className="
                mt-8
                rounded-xl
                bg-red-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                transition-all
                duration-200
                hover:bg-red-700
                active:scale-95
              "
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }
);

ChartErrorState.displayName = "ChartErrorState";

/* ========================================================================== */
/*                            Enterprise Header                               */
/* ========================================================================== */

const ChartHeader = memo(
  ({
    title,
    subtitle,
    icon: Icon = BarChart3,

    connected = true,

    loading = false,

    onRefresh,

    actions,
  }) => {
    return (
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">

        {/* Left */}

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
            <Icon
              size={24}
              className="text-blue-600"
            />
          </div>

          <div>

            <h3 className="text-lg font-semibold text-slate-900">
              {title}
            </h3>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}

          </div>

        </div>

        {/* Right */}

        <div className="flex flex-wrap items-center gap-3">

          {/* Connection */}

          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              connected
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <span
              className={`mr-2 h-2 w-2 rounded-full ${
                connected
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />

            {connected ? "Live" : "Offline"}
          </span>

          {/* Refresh */}

          {typeof onRefresh === "function" && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="
                rounded-lg
                border
                border-slate-200
                px-3
                py-2
                text-sm
                font-medium
                text-slate-700
                transition-all
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          )}

          {/* Custom Actions */}

          {actions}

        </div>

      </div>
    );
  }
);

ChartHeader.displayName = "ChartHeader";
/* ========================================================================== */
/*                         Enterprise Custom Tooltip                          */
/* ========================================================================== */

const CustomTooltip = memo(
  ({
    active,
    payload,
    label,
    formatter = formatNumber,
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    return (
      <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">

        {/* Header */}

        {label && (
          <div className="mb-3 border-b border-slate-100 pb-2">

            <p className="text-sm font-semibold text-slate-900">
              {label}
            </p>

          </div>
        )}

        {/* Values */}

        <div className="space-y-2">

          {payload.map((entry, index) => (
            <div
              key={`${entry.dataKey}-${index}`}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">

                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      entry.color || COLORS.primary,
                  }}
                />

                <span className="text-sm text-slate-600">
                  {entry.name}
                </span>

              </div>

              <span className="font-semibold text-slate-900">
                {formatter(entry.value)}
              </span>

            </div>
          ))}

        </div>

      </div>
    );
  }
);

CustomTooltip.displayName = "CustomTooltip";

/* ========================================================================== */
/*                         Enterprise Custom Legend                           */
/* ========================================================================== */

const CustomLegend = memo(
  ({ payload }) => {
    if (
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    return (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-5">

        {payload.map((entry) => (
          <div
            key={entry.value}
            className="flex items-center gap-2"
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor:
                  entry.color,
              }}
            />

            <span className="text-sm font-medium text-slate-600">
              {entry.value}
            </span>

          </div>
        ))}

      </div>
    );
  }
);

CustomLegend.displayName = "CustomLegend";
/* ========================================================================== */
/*                          Enterprise Chart Wrapper                          */
/* ========================================================================== */

const ChartWrapper = memo(
  ({
    title,
    subtitle,
    icon,

    loading = false,
    error = null,
    connected = true,

    data = [],

    height = CHART_HEIGHT,

    emptyTitle = DEFAULT_EMPTY_TITLE,
    emptyDescription = DEFAULT_EMPTY_DESCRIPTION,

    onRetry,
    onRefresh,

    actions,

    children,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                              Loading                                   */
    /* ---------------------------------------------------------------------- */

    if (loading) {
      return (
        <ChartSkeleton
          title={title}
          height={height}
        />
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                               Error                                    */
    /* ---------------------------------------------------------------------- */

    if (error) {
      return (
        <ChartErrorState
          title={DEFAULT_ERROR_TITLE}
          description={
            typeof error === "string"
              ? error
              : DEFAULT_ERROR_DESCRIPTION
          }
          onRetry={onRetry}
        />
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                            Empty Dataset                               */
    /* ---------------------------------------------------------------------- */

    const hasChartData =
      Array.isArray(data) &&
      data.length > 0;

    if (!hasChartData) {
      return (
        <ChartEmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={icon}
          action={onRetry}
          actionLabel="Reload Data"
        />
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                              Content                                   */
    /* ---------------------------------------------------------------------- */

    return (
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
          transition-all
          duration-300
          hover:shadow-lg
        "
      >

        {/* ================================================================ */}
        {/* Header                                                          */}
        {/* ================================================================ */}

        <ChartHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          connected={connected}
          loading={loading}
          onRefresh={onRefresh}
          actions={actions}
        />

        {/* ================================================================ */}
        {/* Chart                                                           */}
        {/* ================================================================ */}

        <div
          className="w-full px-6 py-5"
          style={{
            height,
          }}
        >
          {children}
        </div>

      </div>
    );
  }
);

/* ========================================================================== */
/*                          React.memo Display Name                           */
/* ========================================================================== */

ChartWrapper.displayName = "ChartWrapper";
/* ========================================================================== */
/*                       Enterprise Email Trend Chart                         */
/* ========================================================================== */

const EmailTrendChart = memo(
  ({
    data = EMPTY_EMAIL_TREND,

    loading = false,

    error = null,

    connected = true,

    onRetry,

    onRefresh,

    onChartClick,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                          Memoized Chart Data                           */
    /* ---------------------------------------------------------------------- */

    const chartData = useMemo(() => {
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item) => ({
        date:
          item.date ??
          item.label ??
          "-",

        emails: safeNumber(
          item.emails
        ),

        completed: safeNumber(
          item.completed
        ),

        pending: safeNumber(
          item.pending
        ),

        highPriority: safeNumber(
          item.highPriority
        ),
      }));
    }, [data]);

    /* ---------------------------------------------------------------------- */
    /*                          Total Analytics                               */
    /* ---------------------------------------------------------------------- */

    const totalEmails = useMemo(
      () =>
        chartData.reduce(
          (sum, item) =>
            sum + item.emails,
          0
        ),
      [chartData]
    );

    const totalCompleted = useMemo(
      () =>
        chartData.reduce(
          (sum, item) =>
            sum + item.completed,
          0
        ),
      [chartData]
    );

    const completionRate = useMemo(() => {
      if (!totalEmails) return 0;

      return Math.round(
        (totalCompleted /
          totalEmails) *
          100
      );
    }, [
      totalEmails,
      totalCompleted,
    ]);

    /* ---------------------------------------------------------------------- */
    /*                          Header Actions                                */
    /* ---------------------------------------------------------------------- */

    const headerActions = (
      <div className="flex items-center gap-2">

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {formatNumber(
            totalEmails
          )} Emails
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          {completionRate}% Complete
        </span>

      </div>
    );

    /* ---------------------------------------------------------------------- */
    /*                           Chart Wrapper                                */
    /* ---------------------------------------------------------------------- */

    return (
      <ChartWrapper
        title={
          EMAIL_TREND_CONFIG.title
        }
        subtitle={
          EMAIL_TREND_CONFIG.subtitle
        }
        icon={
          EMAIL_TREND_CONFIG.icon
        }
        data={chartData}
        loading={loading}
        error={error}
        connected={connected}
        height={
          EMAIL_TREND_CONFIG.height
        }
        onRetry={onRetry}
        onRefresh={onRefresh}
        actions={headerActions}
      >

        {/* =============================================================== */}
        {/* Part 3B starts below                                           */}
        {/* ResponsiveContainer + LineChart                                */}
        {/* =============================================================== */}

      </ChartWrapper>
    );
  }
);

EmailTrendChart.displayName =
  "EmailTrendChart";
          <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart
            data={chartData}
            margin={SHARED_CHART_CONFIG.margin}
            onClick={onChartClick}
          >
            {/* ========================================================== */}
            {/* Grid */}
            {/* ========================================================== */}

            <CartesianGrid
              stroke={SHARED_CHART_CONFIG.grid.stroke}
              strokeDasharray={
                SHARED_CHART_CONFIG.grid.strokeDasharray
              }
              vertical={false}
            />

            {/* ========================================================== */}
            {/* X Axis */}
            {/* ========================================================== */}

            <XAxis
              dataKey={EMAIL_TREND_CONFIG.xKey}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
            />

            {/* ========================================================== */}
            {/* Y Axis */}
            {/* ========================================================== */}

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
            />

            {/* ========================================================== */}
            {/* Tooltip */}
            {/* ========================================================== */}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: COLORS.primary,
                strokeDasharray: "4 4",
              }}
            />

            {/* ========================================================== */}
            {/* Legend */}
            {/* ========================================================== */}

            <Legend
              verticalAlign="bottom"
              align="center"
              content={<CustomLegend />}
            />

            {/* ========================================================== */}
            {/* Part 3C starts here */}
            {/* Email Lines */}
            {/* ========================================================== */}

          </LineChart>
        </ResponsiveContainer>
                    {/* ========================================================== */}
            {/* Emails Line */}
            {/* ========================================================== */}

            <Line
              type="monotone"
              dataKey="emails"
              name="Emails"
              stroke={COLORS.primary}
              strokeWidth={3}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "#FFFFFF",
              }}
              activeDot={{
                r: 7,
                stroke: COLORS.primary,
                strokeWidth: 2,
                fill: "#FFFFFF",
              }}
              animationDuration={
                SHARED_CHART_CONFIG.animation.duration
              }
              animationBegin={0}
              isAnimationActive
            />

            {/* ========================================================== */}
            {/* Completed Line */}
            {/* ========================================================== */}

            <Line
              type="monotone"
              dataKey="completed"
              name="Completed"
              stroke={COLORS.success}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
              }}
              animationDuration={
                SHARED_CHART_CONFIG.animation.duration
              }
              animationBegin={150}
              isAnimationActive
            />

            {/* ========================================================== */}
            {/* Pending Line */}
            {/* ========================================================== */}

            <Line
              type="monotone"
              dataKey="pending"
              name="Pending"
              stroke={COLORS.warning}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
              }}
              animationDuration={
                SHARED_CHART_CONFIG.animation.duration
              }
              animationBegin={300}
              isAnimationActive
            />

            {/* ========================================================== */}
            {/* Optional Reference Line */}
            {/* ========================================================== */}

            <ReferenceLine
              y={averageByKey(chartData, "emails")}
              stroke={COLORS.gray}
              strokeDasharray="5 5"
              label={{
                value: "Average",
                fill: COLORS.slate,
                fontSize: 11,
              }}
            />
            /* ========================================================================== */
/*                 Enterprise Priority Distribution Chart                     */
/* ========================================================================== */

const PriorityDistributionChart = memo(
  ({
    data = EMPTY_PRIORITY_DATA,

    loading = false,

    error = null,

    connected = true,

    onRetry,

    onRefresh,

    onChartClick,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                         Memoized Priority Data                         */
    /* ---------------------------------------------------------------------- */

    const chartData = useMemo(() => {
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item, index) => ({
        name:
          item.name ??
          item.priority ??
          `Priority ${index + 1}`,

        value: safeNumber(item.value),

        color:
          item.color ??
          PRIORITY_CHART_CONFIG.colors[
            index %
            PRIORITY_CHART_CONFIG.colors.length
          ],
      }));
    }, [data]);

    /* ---------------------------------------------------------------------- */
    /*                         Analytics                                      */
    /* ---------------------------------------------------------------------- */

    const totalEmails = useMemo(
      () =>
        chartData.reduce(
          (sum, item) =>
            sum + item.value,
          0
        ),
      [chartData]
    );

    const highestPriority = useMemo(() => {
      if (!chartData.length) return null;

      return [...chartData].sort(
        (a, b) => b.value - a.value
      )[0];
    }, [chartData]);

    const highestPercentage = useMemo(() => {
      if (!highestPriority || !totalEmails) {
        return 0;
      }

      return Math.round(
        (highestPriority.value /
          totalEmails) *
          100
      );
    }, [
      highestPriority,
      totalEmails,
    ]);

    /* ---------------------------------------------------------------------- */
    /*                         Header Actions                                 */
    /* ---------------------------------------------------------------------- */

    const headerActions = (
      <div className="flex flex-wrap items-center gap-2">

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {formatNumber(totalEmails)} Emails
        </span>

        {highestPriority && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
            {highestPriority.name}: {highestPercentage}%
          </span>
        )}

      </div>
    );

    /* ---------------------------------------------------------------------- */
    /*                          Chart Wrapper                                 */
    /* ---------------------------------------------------------------------- */

    return (
      <ChartWrapper
        title={
          PRIORITY_CHART_CONFIG.title
        }
        subtitle={
          PRIORITY_CHART_CONFIG.subtitle
        }
        icon={
          PRIORITY_CHART_CONFIG.icon
        }
        data={chartData}
        loading={loading}
        error={error}
        connected={connected}
        height={
          PRIORITY_CHART_CONFIG.height
        }
        onRetry={onRetry}
        onRefresh={onRefresh}
        actions={headerActions}
      >

        {/* =============================================================== */}
        {/* Part 4B starts here                                             */}
        {/* ResponsiveContainer + PieChart                                 */}
        {/* =============================================================== */}

      </ChartWrapper>
    );
  }
);

PriorityDistributionChart.displayName =
  "PriorityDistributionChart";
          <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <PieChart onClick={onChartClick}>

            {/* ========================================================== */}
            {/* Center Label */}
            {/* ========================================================== */}

            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-900 text-xl font-bold"
            >
              {formatNumber(totalEmails)}
            </text>

            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-slate-500 text-sm"
            >
              Emails
            </text>

            {/* ========================================================== */}
            {/* Pie */}
            {/* ========================================================== */}

            <Pie
              data={chartData}
              dataKey={PRIORITY_CHART_CONFIG.valueKey}
              nameKey={PRIORITY_CHART_CONFIG.nameKey}
              cx="50%"
              cy="50%"
              innerRadius={
                PRIORITY_CHART_CONFIG.innerRadius
              }
              outerRadius={
                PRIORITY_CHART_CONFIG.outerRadius
              }
              paddingAngle={3}
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive
              animationBegin={0}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`priority-cell-${index}`}
                  fill={entry.color}
                  cursor="pointer"
                />
              ))}
            </Pie>

            {/* ========================================================== */}
            {/* Part 4C starts here                                       */}
            {/* Tooltip + Legend + Labels                                 */}
            {/* ========================================================== */}

          </PieChart>
        </ResponsiveContainer>
                    {/* ========================================================== */}
            {/* Tooltip */}
            {/* ========================================================== */}

            <Tooltip
              content={
                <CustomTooltip
                  formatter={(value) =>
                    `${formatNumber(value)} Emails`
                  }
                />
              }
            />

            {/* ========================================================== */}
            {/* Legend */}
            {/* ========================================================== */}

            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              content={<CustomLegend />}
            />

            {/* ========================================================== */}
            {/* Percentage Labels */}
            {/* ========================================================== */}

            <Pie
              data={chartData}
              dataKey={PRIORITY_CHART_CONFIG.valueKey}
              nameKey={PRIORITY_CHART_CONFIG.nameKey}
              cx="50%"
              cy="50%"
              innerRadius={
                PRIORITY_CHART_CONFIG.innerRadius
              }
              outerRadius={
                PRIORITY_CHART_CONFIG.outerRadius
              }
              labelLine={false}
              label={({ percent }) =>
                `${(percent * 100).toFixed(0)}%`
              }
              isAnimationActive={false}
              fill="transparent"
              stroke="transparent"
            />

            {/* ========================================================== */}
            {/* Active Slice Ring */}
            {/* ========================================================== */}

            <Pie
              data={chartData}
              dataKey={PRIORITY_CHART_CONFIG.valueKey}
              nameKey={PRIORITY_CHART_CONFIG.nameKey}
              cx="50%"
              cy="50%"
              innerRadius={
                PRIORITY_CHART_CONFIG.outerRadius + 4
              }
              outerRadius={
                PRIORITY_CHART_CONFIG.outerRadius + 8
              }
              fill="transparent"
              activeIndex={0}
              activeShape={(props) => (
                <Sector
                  {...props}
                  outerRadius={
                    props.outerRadius + 4
                  }
                />
              )}
              stroke="transparent"
            />
            /* ========================================================================== */
/*                  Enterprise Category Analysis Chart                        */
/* ========================================================================== */

const CategoryAnalysisChart = memo(
  ({
    data = EMPTY_CATEGORY_DATA,

    loading = false,

    error = null,

    connected = true,

    onRetry,

    onRefresh,

    onChartClick,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                         Memoized Chart Data                            */
    /* ---------------------------------------------------------------------- */

    const chartData = useMemo(() => {
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item) => ({
        category:
          item.category ??
          item.name ??
          "Unknown",

        emails: safeNumber(item.emails),

        completed: safeNumber(item.completed),

        pending: safeNumber(item.pending),

        highPriority: safeNumber(item.highPriority),
      }));
    }, [data]);

    /* ---------------------------------------------------------------------- */
    /*                        Executive Analytics                             */
    /* ---------------------------------------------------------------------- */

    const totalEmails = useMemo(
      () =>
        chartData.reduce(
          (sum, item) => sum + item.emails,
          0
        ),
      [chartData]
    );

    const topCategory = useMemo(() => {
      if (!chartData.length) return null;

      return [...chartData].sort(
        (a, b) => b.emails - a.emails
      )[0];
    }, [chartData]);

    const averageEmails = useMemo(() => {
      if (!chartData.length) return 0;

      return Math.round(
        totalEmails / chartData.length
      );
    }, [
      chartData,
      totalEmails,
    ]);

    /* ---------------------------------------------------------------------- */
    /*                          Header Actions                                */
    /* ---------------------------------------------------------------------- */

    const headerActions = (
      <div className="flex flex-wrap items-center gap-2">

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {formatNumber(totalEmails)} Emails
        </span>

        {topCategory && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {topCategory.category}
          </span>
        )}

        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          Avg {formatNumber(averageEmails)}
        </span>

      </div>
    );

    /* ---------------------------------------------------------------------- */
    /*                           Chart Wrapper                                */
    /* ---------------------------------------------------------------------- */

    return (
      <ChartWrapper
        title={
          CATEGORY_BAR_CONFIG.title
        }
        subtitle={
          CATEGORY_BAR_CONFIG.subtitle
        }
        icon={
          CATEGORY_BAR_CONFIG.icon
        }
        data={chartData}
        loading={loading}
        error={error}
        connected={connected}
        height={
          CATEGORY_BAR_CONFIG.height
        }
        onRetry={onRetry}
        onRefresh={onRefresh}
        actions={headerActions}
      >

        {/* =============================================================== */}
        {/* Part 5B starts here                                             */}
        {/* ResponsiveContainer + BarChart                                 */}
        {/* =============================================================== */}

      </ChartWrapper>
    );
  }
);

CategoryAnalysisChart.displayName =
  "CategoryAnalysisChart";
          <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            data={chartData}
            margin={SHARED_CHART_CONFIG.margin}
            onClick={onChartClick}
            barCategoryGap="18%"
          >
            {/* ========================================================== */}
            {/* Grid */}
            {/* ========================================================== */}

            <CartesianGrid
              stroke={SHARED_CHART_CONFIG.grid.stroke}
              strokeDasharray={
                SHARED_CHART_CONFIG.grid.strokeDasharray
              }
              vertical={false}
            />

            {/* ========================================================== */}
            {/* X Axis */}
            {/* ========================================================== */}

            <XAxis
              dataKey="category"
              tickLine={false}
              axisLine={false}
              interval={0}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
            />

            {/* ========================================================== */}
            {/* Y Axis */}
            {/* ========================================================== */}

            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
            />

            {/* ========================================================== */}
            {/* Tooltip */}
            {/* ========================================================== */}

            <Tooltip
              content={
                <CustomTooltip
                  formatter={(value) =>
                    formatNumber(value)
                  }
                />
              }
              cursor={{
                fill: "rgba(59,130,246,0.08)",
              }}
            />

            {/* ========================================================== */}
            {/* Legend */}
            {/* ========================================================== */}

            <Legend
              verticalAlign="bottom"
              align="center"
              content={<CustomLegend />}
            />

            {/* ========================================================== */}
            {/* Part 5C starts here */}
            {/* Bars + Labels + Animation */}
            {/* ========================================================== */}

          </BarChart>
        </ResponsiveContainer>
                    {/* ========================================================== */}
            {/* Emails Bar */}
            {/* ========================================================== */}

            <Bar
              dataKey="emails"
              name="Emails"
              fill={COLORS.primary}
              radius={BAR_RADIUS}
              maxBarSize={42}
              isAnimationActive
              animationBegin={STAGGER_ANIMATION.first}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            >
              <LabelList
                dataKey="emails"
                position="top"
                formatter={formatNumber}
                style={{
                  fill: COLORS.slate,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Bar>

            {/* ========================================================== */}
            {/* Completed Bar */}
            {/* ========================================================== */}

            <Bar
              dataKey="completed"
              name="Completed"
              fill={COLORS.success}
              radius={BAR_RADIUS}
              maxBarSize={42}
              isAnimationActive
              animationBegin={STAGGER_ANIMATION.second}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            />

            {/* ========================================================== */}
            {/* Pending Bar */}
            {/* ========================================================== */}

            <Bar
              dataKey="pending"
              name="Pending"
              fill={COLORS.warning}
              radius={BAR_RADIUS}
              maxBarSize={42}
              isAnimationActive
              animationBegin={STAGGER_ANIMATION.third}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            />

            {/* ========================================================== */}
            {/* Average Reference Line */}
            {/* ========================================================== */}

            <ReferenceLine
              y={averageEmails}
              stroke={COLORS.danger}
              strokeDasharray="5 5"
              ifOverflow="extendDomain"
              label={{
                value: `Avg ${formatNumber(
                  averageEmails
                )}`,
                position: "right",
                fill: COLORS.danger,
                fontSize: 11,
              }}
            />
            /* ========================================================================== */
/*                 Enterprise Company Performance Chart                       */
/* ========================================================================== */

const CompanyPerformanceChart = memo(
  ({
    data = EMPTY_COMPANY_DATA,

    loading = false,

    error = null,

    connected = true,

    onRetry,

    onRefresh,

    onChartClick,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                         Memoized Company Data                          */
    /* ---------------------------------------------------------------------- */

    const chartData = useMemo(() => {
      if (!Array.isArray(data)) {
        return [];
      }

      return [...data]
        .map((item) => ({
          company:
            item.company ??
            item.name ??
            "Unknown",

          emails: safeNumber(item.emails),

          completed: safeNumber(item.completed),

          pending: safeNumber(item.pending),

          responseTime: safeNumber(
            item.responseTime
          ),
        }))
        .sort(
          (a, b) => b.emails - a.emails
        )
        .slice(
          0,
          COMPANY_PERFORMANCE_CONFIG.maxCompanies
        );
    }, [data]);

    /* ---------------------------------------------------------------------- */
    /*                        Executive Analytics                             */
    /* ---------------------------------------------------------------------- */

    const totalEmails = useMemo(
      () =>
        chartData.reduce(
          (sum, item) => sum + item.emails,
          0
        ),
      [chartData]
    );

    const topCompany = useMemo(
      () => chartData[0] ?? null,
      [chartData]
    );

    const averageEmails = useMemo(() => {
      if (!chartData.length) return 0;

      return Math.round(
        totalEmails / chartData.length
      );
    }, [
      chartData,
      totalEmails,
    ]);

    const totalCompleted = useMemo(
      () =>
        chartData.reduce(
          (sum, item) =>
            sum + item.completed,
          0
        ),
      [chartData]
    );

    const completionRate = useMemo(() => {
      if (!totalEmails) return 0;

      return Math.round(
        (totalCompleted /
          totalEmails) *
          100
      );
    }, [
      totalEmails,
      totalCompleted,
    ]);

    /* ---------------------------------------------------------------------- */
    /*                         Header Actions                                 */
    /* ---------------------------------------------------------------------- */

    const headerActions = (
      <div className="flex flex-wrap items-center gap-2">

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {formatNumber(totalEmails)} Emails
        </span>

        {topCompany && (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            #{1} {topCompany.company}
          </span>
        )}

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          {completionRate}% Completed
        </span>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Avg {formatNumber(averageEmails)}
        </span>

      </div>
    );

    /* ---------------------------------------------------------------------- */
    /*                          Chart Wrapper                                 */
    /* ---------------------------------------------------------------------- */

    return (
      <ChartWrapper
        title={
          COMPANY_PERFORMANCE_CONFIG.title
        }
        subtitle={
          COMPANY_PERFORMANCE_CONFIG.subtitle
        }
        icon={
          COMPANY_PERFORMANCE_CONFIG.icon
        }
        data={chartData}
        loading={loading}
        error={error}
        connected={connected}
        height={
          COMPANY_PERFORMANCE_CONFIG.height
        }
        onRetry={onRetry}
        onRefresh={onRefresh}
        actions={headerActions}
      >

        {/* =============================================================== */}
        {/* Part 6B starts here                                             */}
        {/* ResponsiveContainer + Horizontal BarChart                       */}
        {/* =============================================================== */}

      </ChartWrapper>
    );
  }
);

CompanyPerformanceChart.displayName =
  "CompanyPerformanceChart";
          <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <BarChart
            layout="vertical"
            data={chartData}
            margin={HORIZONTAL_MARGIN}
            onClick={onChartClick}
            barCategoryGap="18%"
          >

            {/* ========================================================== */}
            {/* Grid */}
            {/* ========================================================== */}

            <CartesianGrid
              stroke={SHARED_CHART_CONFIG.grid.stroke}
              strokeDasharray={
                SHARED_CHART_CONFIG.grid.strokeDasharray
              }
              horizontal={true}
              vertical={false}
            />

            {/* ========================================================== */}
            {/* X Axis (Values) */}
            {/* ========================================================== */}

            <XAxis
              type="number"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
              tickFormatter={formatNumber}
            />

            {/* ========================================================== */}
            {/* Y Axis (Companies) */}
            {/* ========================================================== */}

            <YAxis
              type="category"
              dataKey="company"
              width={150}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
            />

            {/* ========================================================== */}
            {/* Tooltip */}
            {/* ========================================================== */}

            <Tooltip
              cursor={{
                fill: "rgba(59,130,246,0.08)",
              }}
              content={
                <CustomTooltip
                  formatter={formatNumber}
                />
              }
            />

            {/* ========================================================== */}
            {/* Legend */}
            {/* ========================================================== */}

            <Legend
              verticalAlign="bottom"
              align="center"
              content={<CustomLegend />}
            />

            {/* ========================================================== */}
            {/* Part 6C starts here                                        */}
            {/* Horizontal Bars + Labels + Ranking                         */}
            {/* ========================================================== */}

          </BarChart>
        </ResponsiveContainer>
                    {/* ========================================================== */}
            {/* Company Emails */}
            {/* ========================================================== */}

            <Bar
              dataKey="emails"
              name="Emails"
              fill={COLORS.primary}
              radius={BAR_RADIUS}
              maxBarSize={24}
              isAnimationActive
              animationBegin={STAGGER_ANIMATION.first}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            >
              <LabelList
                dataKey="emails"
                position="right"
                formatter={formatNumber}
                style={{
                  fill: COLORS.slate,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Bar>

            {/* ========================================================== */}
            {/* Completed Emails */}
            {/* ========================================================== */}

            <Bar
              dataKey="completed"
              name="Completed"
              fill={COLORS.success}
              radius={BAR_RADIUS}
              maxBarSize={24}
              isAnimationActive
              animationBegin={STAGGER_ANIMATION.second}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            />

            {/* ========================================================== */}
            {/* Pending Emails */}
            {/* ========================================================== */}

            <Bar
              dataKey="pending"
              name="Pending"
              fill={COLORS.warning}
              radius={BAR_RADIUS}
              maxBarSize={24}
              isAnimationActive
              animationBegin={STAGGER_ANIMATION.third}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
            />

            {/* ========================================================== */}
            {/* Average Reference Line */}
            {/* ========================================================== */}

            <ReferenceLine
              x={averageEmails}
              stroke={COLORS.danger}
              strokeDasharray="5 5"
              ifOverflow="extendDomain"
              label={{
                value: `Avg ${formatNumber(
                  averageEmails
                )}`,
                position: "top",
                fill: COLORS.danger,
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {/* ========================================================== */}
            {/* Company Ranking Labels */}
            {/* ========================================================== */}

            {chartData.map((company, index) => (
              <ReferenceDot
                key={`rank-${company.company}`}
                x={0}
                y={company.company}
                r={0}
                label={{
                  value: `#${index + 1}`,
                  position: "left",
                  fill:
                    index === 0
                      ? COLORS.success
                      : COLORS.slate,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            ))}
            /* ========================================================================== */
/*                   Enterprise Productivity Trend Chart                      */
/* ========================================================================== */

const ProductivityTrendChart = memo(
  ({
    data = EMPTY_PRODUCTIVITY_DATA,

    loading = false,

    error = null,

    connected = true,

    onRetry,

    onRefresh,

    onChartClick,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                        Memoized Productivity Data                       */
    /* ---------------------------------------------------------------------- */

    const chartData = useMemo(() => {
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((item) => ({
        date:
          item.date ??
          item.label ??
          "-",

        productivity: safeNumber(
          item.productivity
        ),

        efficiency: safeNumber(
          item.efficiency
        ),

        completed: safeNumber(
          item.completed
        ),

        target: safeNumber(
          item.target
        ),
      }));
    }, [data]);

    /* ---------------------------------------------------------------------- */
    /*                          Executive Analytics                           */
    /* ---------------------------------------------------------------------- */

    const averageProductivity = useMemo(() => {
      if (!chartData.length) return 0;

      return Math.round(
        chartData.reduce(
          (sum, item) =>
            sum + item.productivity,
          0
        ) / chartData.length
      );
    }, [chartData]);

    const averageEfficiency = useMemo(() => {
      if (!chartData.length) return 0;

      return Math.round(
        chartData.reduce(
          (sum, item) =>
            sum + item.efficiency,
          0
        ) / chartData.length
      );
    }, [chartData]);

    const latestProductivity = useMemo(() => {
      if (!chartData.length) return 0;

      return chartData[
        chartData.length - 1
      ].productivity;
    }, [chartData]);

    const targetAchievement = useMemo(() => {
      if (!chartData.length) return 0;

      const completed =
        chartData.reduce(
          (sum, item) =>
            sum + item.completed,
          0
        );

      const target =
        chartData.reduce(
          (sum, item) =>
            sum + item.target,
          0
        );

      if (!target) return 0;

      return Math.round(
        (completed / target) * 100
      );
    }, [chartData]);

    /* ---------------------------------------------------------------------- */
    /*                           Header Actions                               */
    /* ---------------------------------------------------------------------- */

    const headerActions = (
      <div className="flex flex-wrap items-center gap-2">

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Avg {averageProductivity}%
        </span>

        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Efficiency {averageEfficiency}%
        </span>

        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
          Current {latestProductivity}%
        </span>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Target {targetAchievement}%
        </span>

      </div>
    );

    /* ---------------------------------------------------------------------- */
    /*                           Chart Wrapper                                */
    /* ---------------------------------------------------------------------- */

    return (
      <ChartWrapper
        title={
          PRODUCTIVITY_CHART_CONFIG.title
        }
        subtitle={
          PRODUCTIVITY_CHART_CONFIG.subtitle
        }
        icon={
          PRODUCTIVITY_CHART_CONFIG.icon
        }
        data={chartData}
        loading={loading}
        error={error}
        connected={connected}
        height={
          PRODUCTIVITY_CHART_CONFIG.height
        }
        onRetry={onRetry}
        onRefresh={onRefresh}
        actions={headerActions}
      >

        {/* =============================================================== */}
        {/* Part 7B starts here                                             */}
        {/* ResponsiveContainer + AreaChart                                */}
        {/* =============================================================== */}

      </ChartWrapper>
    );
  }
);

ProductivityTrendChart.displayName =
  "ProductivityTrendChart";
          <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart
            data={chartData}
            margin={SHARED_CHART_CONFIG.margin}
            onClick={onChartClick}
          >

            {/* ========================================================== */}
            {/* Linear Gradients */}
            {/* ========================================================== */}

            <defs>

              <linearGradient
                id="productivityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORS.primary}
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor={COLORS.primary}
                  stopOpacity={0.03}
                />
              </linearGradient>

              <linearGradient
                id="efficiencyGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORS.success}
                  stopOpacity={0.30}
                />

                <stop
                  offset="95%"
                  stopColor={COLORS.success}
                  stopOpacity={0.03}
                />
              </linearGradient>

            </defs>

            {/* ========================================================== */}
            {/* Grid */}
            {/* ========================================================== */}

            <CartesianGrid
              stroke={SHARED_CHART_CONFIG.grid.stroke}
              strokeDasharray={
                SHARED_CHART_CONFIG.grid.strokeDasharray
              }
              vertical={false}
            />

            {/* ========================================================== */}
            {/* X Axis */}
            {/* ========================================================== */}

            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
            />

            {/* ========================================================== */}
            {/* Y Axis */}
            {/* ========================================================== */}

            <YAxis
              allowDecimals={false}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{
                fill: COLORS.slate,
                fontSize: 12,
              }}
              tickFormatter={(value) => `${value}%`}
            />

            {/* ========================================================== */}
            {/* Reference Line */}
            {/* ========================================================== */}

            <ReferenceLine
              y={averageProductivity}
              stroke={COLORS.warning}
              strokeDasharray="5 5"
              label={{
                value: `Avg ${averageProductivity}%`,
                position: "right",
                fill: COLORS.warning,
                fontSize: 11,
              }}
            />

            {/* ========================================================== */}
            {/* Part 7C starts here */}
            {/* Tooltip + Legend + Area Components */}
            {/* ========================================================== */}

          </AreaChart>
        </ResponsiveContainer>
                    {/* ========================================================== */}
            {/* Tooltip */}
            {/* ========================================================== */}

            <Tooltip
              cursor={{
                stroke: COLORS.primary,
                strokeDasharray: "4 4",
              }}
              content={
                <CustomTooltip
                  formatter={(value) => `${value}%`}
                />
              }
            />

            {/* ========================================================== */}
            {/* Legend */}
            {/* ========================================================== */}

            <Legend
              verticalAlign="bottom"
              align="center"
              content={<CustomLegend />}
            />

            {/* ========================================================== */}
            {/* Productivity Area */}
            {/* ========================================================== */}

            <Area
              type="monotone"
              dataKey="productivity"
              name="Productivity"
              stroke={COLORS.primary}
              fill="url(#productivityGradient)"
              strokeWidth={3}
              animationBegin={STAGGER_ANIMATION.first}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
              isAnimationActive
              activeDot={{
                r: 6,
                stroke: COLORS.primary,
                strokeWidth: 2,
                fill: "#fff",
              }}
            >
              <LabelList
                dataKey="productivity"
                position="top"
                formatter={(value) => `${value}%`}
                style={{
                  fill: COLORS.slate,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Area>

            {/* ========================================================== */}
            {/* Efficiency Area */}
            {/* ========================================================== */}

            <Area
              type="monotone"
              dataKey="efficiency"
              name="Efficiency"
              stroke={COLORS.success}
              fill="url(#efficiencyGradient)"
              strokeWidth={2.5}
              animationBegin={STAGGER_ANIMATION.second}
              animationDuration={
                SHARED_CHART_CONFIG.animation.animationDuration
              }
              isAnimationActive
              activeDot={{
                r: 5,
                stroke: COLORS.success,
                strokeWidth: 2,
                fill: "#fff",
              }}
            />
            /* ========================================================================== */
/*                        Enterprise AI Insights Panel                        */
/* ========================================================================== */

const AIInsightsPanel = memo(
  ({
    stats = {},
    loading = false,
    connected = true,
  }) => {

    /* ---------------------------------------------------------------------- */
    /*                            AI Insights                                 */
    /* ---------------------------------------------------------------------- */

    const insights = useMemo(() => {

      const totalEmails =
        safeNumber(stats.totalEmails);

      const completed =
        safeNumber(stats.completed);

      const pending =
        safeNumber(stats.pending);

      const highPriority =
        safeNumber(stats.highPriority);

      const completionRate =
        totalEmails
          ? Math.round(
              (completed / totalEmails) * 100
            )
          : 0;

      return [
        {
          id: 1,
          type: "success",
          title: "Executive Summary",
          description:
            completionRate >= 90
              ? "Overall email operations are performing above target."
              : "Completion rate is below enterprise target.",
        },

        {
          id: 2,
          type: "warning",
          title: "Pending Workload",
          description:
            pending > 50
              ? "Pending email queue requires immediate attention."
              : "Pending workload is under control.",
        },

        {
          id: 3,
          type: "danger",
          title: "High Priority",
          description:
            highPriority > 20
              ? "Critical emails detected requiring escalation."
              : "High-priority emails are within acceptable limits.",
        },
      ];

    }, [stats]);

    /* ---------------------------------------------------------------------- */
    /*                         Smart Recommendations                           */
    /* ---------------------------------------------------------------------- */

    const recommendations = useMemo(() => {

      return [

        "Prioritize unresolved high-priority emails.",

        "Assign additional agents during peak hours.",

        "Reduce average response time below SLA target.",

        "Monitor enterprise productivity trends daily.",

      ];

    }, []);

    /* ---------------------------------------------------------------------- */
    /*                              Loading                                   */
    /* ---------------------------------------------------------------------- */

    if (loading) {
      return (
        <ChartSkeleton height={340} />
      );
    }

    /* ---------------------------------------------------------------------- */
    /*                                UI                                      */
    /* ---------------------------------------------------------------------- */

    return (

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* ================================================================ */}
        {/* Header */}
        {/* ================================================================ */}

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              AI Executive Insights
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Intelligent analysis generated from Microsoft Outlook activity
            </p>

          </div>

          <StatusIndicator
            connected={connected}
          />

        </div>

        {/* ================================================================ */}
        {/* Insights */}
        {/* ================================================================ */}

        <div className="grid gap-4 lg:grid-cols-3">

          {insights.map((item) => (

            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:shadow-md"
            >

              <h4 className="mb-2 font-semibold text-slate-900">
                {item.title}
              </h4>

              <p className="text-sm leading-6 text-slate-600">
                {item.description}
              </p>

            </div>

          ))}

        </div>

        {/* ================================================================ */}
        {/* Smart Recommendations */}
        {/* ================================================================ */}

        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5">

          <h3 className="mb-4 text-lg font-semibold text-blue-700">
            Smart Recommendations
          </h3>

          <ul className="space-y-3">

            {recommendations.map((item) => (

              <li
                key={item}
                className="flex items-start gap-3 text-sm text-slate-700"
              >

                <CheckCircle2
                  size={18}
                  className="mt-0.5 text-green-600"
                />

                <span>{item}</span>

              </li>

            ))}

          </ul>

        </div>

      </section>

    );

  }
);

AIInsightsPanel.displayName =
  "AIInsightsPanel";
  /* ========================================================================== */
/*                          Enterprise Dashboard Charts                       */
/* ========================================================================== */

const DashboardCharts = memo(
  ({
    analytics = {},
    loading = false,
    error = null,
    connected = true,
    onRetry,
    onRefresh,
    onChartClick,
  }) => {

    return (

      <section className="space-y-8">

        {/* ================================================================ */}
        {/* Executive Charts */}
        {/* ================================================================ */}

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">

          <EmailTrendChart
            data={analytics.emailTrend}
            loading={loading}
            error={error}
            connected={connected}
            onRetry={onRetry}
            onRefresh={onRefresh}
            onChartClick={onChartClick}
          />

          <PriorityDistributionChart
            data={analytics.priorityDistribution}
            loading={loading}
            error={error}
            connected={connected}
            onRetry={onRetry}
            onRefresh={onRefresh}
            onChartClick={onChartClick}
          />

        </div>

        {/* ================================================================ */}
        {/* Analytics Charts */}
        {/* ================================================================ */}

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">

          <CategoryAnalysisChart
            data={analytics.categoryAnalysis}
            loading={loading}
            error={error}
            connected={connected}
            onRetry={onRetry}
            onRefresh={onRefresh}
            onChartClick={onChartClick}
          />

          <CompanyPerformanceChart
            data={analytics.companyPerformance}
            loading={loading}
            error={error}
            connected={connected}
            onRetry={onRetry}
            onRefresh={onRefresh}
            onChartClick={onChartClick}
          />

        </div>

        {/* ================================================================ */}
        {/* Productivity */}
        {/* ================================================================ */}

        <ProductivityTrendChart
          data={analytics.productivityTrend}
          loading={loading}
          error={error}
          connected={connected}
          onRetry={onRetry}
          onRefresh={onRefresh}
          onChartClick={onChartClick}
        />

        {/* ================================================================ */}
        {/* AI Insights */}
        {/* ================================================================ */}

        <AIInsightsPanel
          stats={analytics.stats}
          loading={loading}
          connected={connected}
        />

      </section>

    );

  }
);

DashboardCharts.displayName =
  "DashboardCharts";
        {/* ================================================================== */}
      {/* Enterprise Footer */}
      {/* ================================================================== */}

      <footer className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          {/* Left Section */}
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Enterprise Outlook Analytics Dashboard
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Live Microsoft Graph analytics with AI-powered executive insights
              and enterprise reporting.
            </p>
          </div>

          {/* Right Section */}
          <div className="flex flex-wrap items-center gap-8">

            {/* Connection Status */}
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Connection
              </p>

              <div className="mt-2 flex items-center justify-end gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    connected ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />

                <span
                  className={`text-sm font-semibold ${
                    connected ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {connected
                    ? "Microsoft Graph Connected"
                    : "Offline"}
                </span>
              </div>
            </div>

            {/* Last Refresh */}
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Last Refresh
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                {new Date().toLocaleString("en-IN")}
              </p>
            </div>

          </div>

        </div>
      </footer>

 
DashboardCharts.displayName = "DashboardCharts";

export {
  EmailTrendChart,
  PriorityDistributionChart,
  CategoryAnalysisChart,
  CompanyPerformanceChart,
  ProductivityTrendChart,
  AIInsightsPanel,
};

export default memo(DashboardCharts);
// ===========================================================
// ReportCharts.jsx
// PART 1
// Imports + Enterprise Configuration + Helpers
// Microsoft 365 Executive Charts
// ===========================================================

import React, { memo, useMemo } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  TrendingUp,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";

import "./ReportsComponents.css";

// ===========================================================
// Microsoft Enterprise Color Palette
// ===========================================================

const COLORS = {
  primary: "#2563EB",
  secondary: "#0EA5E9",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  cyan: "#06B6D4",
  pink: "#EC4899",
};

const PIE_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

// ===========================================================
// Safe Data Helper
// ===========================================================

const getData = (value) =>
  Array.isArray(value) ? value : [];

// ===========================================================
// Empty Chart Component
// ===========================================================

const EmptyChart = memo(({ title }) => (
  <div className="chart-card">

    <div className="chart-header">

      <h3>{title}</h3>

    </div>

    <div className="chart-empty">

      <Activity size={42} />

      <p>No Microsoft Graph data available.</p>

    </div>

  </div>
));

// ===========================================================
// Enterprise Tooltip
// ===========================================================

const EnterpriseTooltip = ({ active, payload, label }) => {

  if (!active || !payload || !payload.length) return null;

  return (

    <div className="enterprise-tooltip">

      <h5>{label}</h5>

      {payload.map((item) => (

        <div
          key={item.dataKey}
          className="tooltip-row"
        >

          <span>{item.name}</span>

          <strong>{item.value}</strong>

        </div>

      ))}

    </div>

  );
};

// ===========================================================
// Enterprise Chart Card
// ===========================================================

const ChartCard = memo(
  ({ title, icon, children }) => (

    <section className="chart-card">

      <div className="chart-header">

        <div className="chart-title">

          {icon}

          <h3>{title}</h3>

        </div>

      </div>

      <div className="chart-body">

        {children}

      </div>

    </section>

  )
);

// ===========================================================
// Reports Charts Component
// ===========================================================

const ReportCharts = memo(({ data = {} }) => {

  // =========================================================
  // Memoized Live Data
  // =========================================================

  const dailyTrend = useMemo(
    () => getData(data.dailyTrend),
    [data]
  );

  const weeklyTrend = useMemo(
    () => getData(data.weeklyTrend),
    [data]
  );

  const monthlyTrend = useMemo(
    () => getData(data.monthlyTrend),
    [data]
  );

  const priorityDistribution = useMemo(
    () => getData(data.priorityDistribution),
    [data]
  );

  const statusDistribution = useMemo(
    () => getData(data.statusDistribution),
    [data]
  );

  const companyDistribution = useMemo(
    () => getData(data.companyDistribution),
    [data]
  );

  const employeeProductivity = useMemo(
    () => getData(data.employeeProductivity),
    [data]
  );

  const categoryAnalysis = useMemo(
    () => getData(data.categoryAnalysis),
    [data]
  );

  const responseTrend = useMemo(
    () => getData(data.responseTrend),
    [data]
  );

  // =========================================================
  // Part 2 Continues...
  // Daily Trend
  // Weekly Trend
  // Monthly Trend
  // =========================================================
    // =========================================================
  // PART 2
  // Daily + Weekly + Monthly Trend Charts
  // =========================================================

  return (
    <div className="reports-chart-grid">

      {/* =====================================================
          DAILY EMAIL TREND
      ===================================================== */}

      {dailyTrend.length > 0 ? (
        <ChartCard
          title="Daily Email Trend"
          icon={<TrendingUp size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={dailyTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
              />

              <YAxis
                tick={{ fontSize: 12 }}
              />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="emails"
                name="Emails"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Daily Email Trend" />
      )}

      {/* =====================================================
          WEEKLY EMAIL TREND
      ===================================================== */}

      {weeklyTrend.length > 0 ? (
        <ChartCard
          title="Weekly Email Trend"
          icon={<TrendingUp size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={weeklyTrend}>
              <defs>
                <linearGradient
                  id="weeklyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={COLORS.success}
                    stopOpacity={0.35}
                  />

                  <stop
                    offset="95%"
                    stopColor={COLORS.success}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis dataKey="label" />

              <YAxis />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Area
                type="monotone"
                dataKey="emails"
                name="Emails"
                stroke={COLORS.success}
                fill="url(#weeklyGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Weekly Email Trend" />
      )}

      {/* =====================================================
          MONTHLY EMAIL TREND
      ===================================================== */}

      {monthlyTrend.length > 0 ? (
        <ChartCard
          title="Monthly Email Trend"
          icon={<BarChart3 size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis
                dataKey="label"
              />

              <YAxis />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Bar
                dataKey="emails"
                name="Emails"
                radius={[8, 8, 0, 0]}
                fill={COLORS.secondary}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Monthly Email Trend" />
      )}

      {/* =====================================================
          Part 3 Continues...
          - Priority Distribution
          - Status Distribution
          - Pie Charts
      ===================================================== */}
            {/* =====================================================
          PRIORITY DISTRIBUTION
      ===================================================== */}

      {priorityDistribution.length > 0 ? (
        <ChartCard
          title="Priority Distribution"
          icon={<PieChartIcon size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>

              <Pie
                data={priorityDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={55}
                paddingAngle={3}
                label
              >
                {priorityDistribution.map((entry, index) => (
                  <Cell
                    key={`priority-${index}`}
                    fill={
                      PIE_COLORS[
                        index % PIE_COLORS.length
                      ]
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Priority Distribution" />
      )}

      {/* =====================================================
          STATUS DISTRIBUTION
      ===================================================== */}

      {statusDistribution.length > 0 ? (
        <ChartCard
          title="Status Distribution"
          icon={<PieChartIcon size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>

              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius={55}
                paddingAngle={3}
                label
              >
                {statusDistribution.map((entry, index) => (
                  <Cell
                    key={`status-${index}`}
                    fill={
                      PIE_COLORS[
                        index % PIE_COLORS.length
                      ]
                    }
                  />
                ))}
              </Pie>

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Status Distribution" />
      )}

      {/* =====================================================
          RESPONSE RATE TREND
      ===================================================== */}

      {responseTrend.length > 0 ? (
        <ChartCard
          title="Response Rate Trend"
          icon={<TrendingUp size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={responseTrend}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis dataKey="label" />

              <YAxis />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="responseRate"
                name="Response Rate (%)"
                stroke={COLORS.purple}
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />

            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Response Rate Trend" />
      )}

      {/* =====================================================
          PART 4 CONTINUES
          - Company Distribution
          - Employee Productivity
          - Category Analysis
          - Component Export
      ===================================================== */}
            {/* =====================================================
          COMPANY-WISE EMAIL DISTRIBUTION
      ===================================================== */}

      {companyDistribution.length > 0 ? (
        <ChartCard
          title="Company-wise Email Distribution"
          icon={<BarChart3 size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={companyDistribution}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
              />

              <YAxis />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Bar
                dataKey="emails"
                name="Emails"
                fill={COLORS.primary}
                radius={[8, 8, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Company-wise Email Distribution" />
      )}

      {/* =====================================================
          EMPLOYEE PRODUCTIVITY
      ===================================================== */}

      {employeeProductivity.length > 0 ? (
        <ChartCard
          title="Employee Productivity"
          icon={<TrendingUp size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={employeeProductivity}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
              />

              <YAxis />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Bar
                dataKey="completed"
                name="Completed"
                fill={COLORS.success}
                radius={[8, 8, 0, 0]}
              />

              <Bar
                dataKey="pending"
                name="Pending"
                fill={COLORS.warning}
                radius={[8, 8, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Employee Productivity" />
      )}

      {/* =====================================================
          CATEGORY ANALYSIS
      ===================================================== */}

      {categoryAnalysis.length > 0 ? (
        <ChartCard
          title="Category Analysis"
          icon={<Activity size={18} />}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categoryAnalysis}>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
              />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
              />

              <YAxis />

              <Tooltip
                content={<EnterpriseTooltip />}
              />

              <Legend />

              <Bar
                dataKey="value"
                name="Emails"
                fill={COLORS.purple}
                radius={[8, 8, 0, 0]}
              />

            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : (
        <EmptyChart title="Category Analysis" />
      )}

    </div>
  );
});

// ===========================================================
// Export Component
// ===========================================================

export default ReportCharts;
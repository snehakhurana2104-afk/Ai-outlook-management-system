// ===========================================================
// ReportSkeleton.jsx
// Microsoft 365 Enterprise Loading Skeleton
// ===========================================================

import React, { memo } from "react";

import "./ReportsComponents.css";

const SummarySkeleton = () => (
  <div className="summary-card">
    <div
      className="skeleton"
      style={{
        width: 60,
        height: 60,
        borderRadius: 16,
      }}
    />

    <div
      style={{
        flex: 1,
      }}
    >
      <div
        className="skeleton"
        style={{
          width: "70%",
          height: 14,
          marginBottom: 12,
        }}
      />

      <div
        className="skeleton"
        style={{
          width: "45%",
          height: 28,
        }}
      />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="chart-card">
    <div
      className="skeleton"
      style={{
        width: "45%",
        height: 20,
        marginBottom: 24,
      }}
    />

    <div
      className="skeleton"
      style={{
        width: "100%",
        height: 280,
      }}
    />
  </div>
);

const TableSkeleton = () => (
  <div className="table-card">

    <div
      className="table-wrapper"
      style={{
        padding: 20,
      }}
    >
      {[...Array(8)].map((_, row) => (
        <div
          key={row}
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr 2fr 1fr 1fr",
            gap: 16,
            marginBottom: 18,
          }}
        >
          {[...Array(5)].map((__, col) => (
            <div
              key={col}
              className="skeleton"
              style={{
                height: 18,
              }}
            />
          ))}
        </div>
      ))}
    </div>

  </div>
);

const ReportSkeleton = () => {
  return (
    <div className="reports-skeleton-container">

      {/* Executive Cards */}

      <div className="executive-summary-grid">
        {[...Array(8)].map((_, index) => (
          <SummarySkeleton
            key={index}
          />
        ))}
      </div>

      {/* Charts */}

      <div className="charts-grid">
        {[...Array(4)].map((_, index) => (
          <ChartSkeleton
            key={index}
          />
        ))}
      </div>

      {/* Table */}

      <TableSkeleton />

    </div>
  );
};

export default memo(ReportSkeleton);
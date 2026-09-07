// ===========================================================
// ReportEmptyState.jsx
// Microsoft 365 Enterprise Empty State
// ===========================================================

import React, { memo } from "react";
import { FileSearch } from "lucide-react";

import "./ReportsComponents.css";

const ReportEmptyState = () => {
  return (
    <section className="empty-card">

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <FileSearch size={80} />
      </div>

      <h2>
        No Reports Available
      </h2>

      <p>
        No Outlook report data is currently available for the
        selected filters.
      </p>

      <p
        style={{
          marginTop: 10,
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Try changing the date range, search criteria, or
        synchronize Microsoft Outlook to load the latest
        email intelligence data.
      </p>

      <button
        type="button"
        className="export-btn"
        style={{
          marginTop: 28,
        }}
        onClick={() => window.location.reload()}
      >
        Refresh Reports
      </button>

    </section>
  );
};

export default memo(ReportEmptyState);
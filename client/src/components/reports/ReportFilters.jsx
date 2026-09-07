// ===========================================================
// ReportFilters.jsx
// Microsoft 365 Enterprise Filters
// ===========================================================

import React, { memo } from "react";

import "./ReportsComponents.css";

const DATE_OPTIONS = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "LAST_WEEK", label: "Last Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "LAST_MONTH", label: "Last Month" },
  { value: "CUSTOM", label: "Custom Range" },
];

const PRIORITY_OPTIONS = [
  "ALL",
  "HIGH",
  "NORMAL",
  "LOW",
];

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

const CATEGORY_OPTIONS = [
  "ALL",
  "Training",
  "Support",
  "Sales",
  "Meeting",
  "HR",
  "Finance",
  "Other",
];

const ReportFilters = ({ filters, onChange }) => {
  const update = (field, value) => {
    onChange({
      [field]: value,
    });
  };

  return (
    <section className="report-filters">

      {/* Date */}

      <div className="filter-group">
        <label>Date Range</label>

        <select
          value={filters.dateRange}
          onChange={(e) =>
            update("dateRange", e.target.value)
          }
        >
          {DATE_OPTIONS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}

      {filters.dateRange === "CUSTOM" && (
        <div className="filter-group">
          <label>Start Date</label>

          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) =>
              update("startDate", e.target.value)
            }
          />
        </div>
      )}

      {/* End Date */}

      {filters.dateRange === "CUSTOM" && (
        <div className="filter-group">
          <label>End Date</label>

          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) =>
              update("endDate", e.target.value)
            }
          />
        </div>
      )}

      {/* Priority */}

      <div className="filter-group">
        <label>Priority</label>

        <select
          value={filters.priority}
          onChange={(e) =>
            update("priority", e.target.value)
          }
        >
          {PRIORITY_OPTIONS.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}

      <div className="filter-group">
        <label>Status</label>

        <select
          value={filters.status}
          onChange={(e) =>
            update("status", e.target.value)
          }
        >
          {STATUS_OPTIONS.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Sender */}

      <div className="filter-group">
        <label>Sender</label>

        <input
          type="text"
          placeholder="Sender Name"
          value={filters.sender === "ALL" ? "" : filters.sender}
          onChange={(e) =>
            update(
              "sender",
              e.target.value || "ALL"
            )
          }
        />
      </div>

      {/* Company */}

      <div className="filter-group">
        <label>Company</label>

        <input
          type="text"
          placeholder="Company"
          value={filters.company === "ALL" ? "" : filters.company}
          onChange={(e) =>
            update(
              "company",
              e.target.value || "ALL"
            )
          }
        />
      </div>

      {/* Category */}

      <div className="filter-group">
        <label>Category</label>

        <select
          value={filters.category}
          onChange={(e) =>
            update("category", e.target.value)
          }
        >
          {CATEGORY_OPTIONS.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>
      </div>

    </section>
  );
};

export default memo(ReportFilters);
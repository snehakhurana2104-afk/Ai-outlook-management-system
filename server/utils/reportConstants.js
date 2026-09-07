/**
 * ============================================================================
 * reportConstants.js
 * Phase 10.1 — Enterprise Report Architecture
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 */

"use strict";

/* ============================================================================
 * Report Types
 * ========================================================================== */

const REPORT_TYPES = Object.freeze({
    ANALYTICS: "analytics",
    TEAM: "team",
    EMAIL: "email",
    EXECUTIVE: "executive",
});

/* ============================================================================
 * Report Formats
 * ========================================================================== */

const REPORT_FORMATS = Object.freeze({
    PDF: "pdf",
    XLSX: "xlsx",
    CSV: "csv",
});

/* ============================================================================
 * Analytics Report Types
 * ========================================================================== */

const ANALYTICS_REPORTS = Object.freeze([
    "overview",
    "trends",
    "productivity",
    "priority",
    "category",
    "company",
]);

/* ============================================================================
 * Team Report Types
 * ========================================================================== */

const TEAM_REPORTS = Object.freeze([
    "team-performance",
    "member-performance",
    "department",
    "productivity",
]);

/* ============================================================================
 * Email Report Types
 * ========================================================================== */

const EMAIL_REPORTS = Object.freeze([
    "summary",
    "response-performance",
    "pending",
    "high-priority",
]);

/* ============================================================================
 * Executive Report Types
 * ========================================================================== */

const EXECUTIVE_REPORTS = Object.freeze([
    "monthly-summary",
    "kpi",
    "management-summary",
]);

/* ============================================================================
 * Allowed Periods
 * ========================================================================== */

const REPORT_PERIODS = Object.freeze([
    "today",
    "week",
    "month",
    "quarter",
    "year",
    "custom",
]);

/* ============================================================================
 * Limits
 * ========================================================================== */

const REPORT_LIMITS = Object.freeze({
    MAX_DATE_RANGE_DAYS: 366,
    MAX_EXPORT_ROWS: 100000,
    MAX_REPORT_SIZE_MB: 25,
});

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    REPORT_TYPES,
    REPORT_FORMATS,

    ANALYTICS_REPORTS,
    TEAM_REPORTS,
    EMAIL_REPORTS,
    EXECUTIVE_REPORTS,

    REPORT_PERIODS,
    REPORT_LIMITS,
};
/**
 * ============================================================================
 * ReportSchedule.js
 * Phase 10.7 — Enterprise Report Scheduling Model
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - Persist scheduled enterprise reports
 * - Tenant-aware scheduling
 * - Daily / weekly / monthly / custom schedules
 * - Report filters
 * - Export format
 * - Next-run tracking
 * - Last-run tracking
 * - Execution history
 * - Failure tracking
 * - Retry tracking
 * - Active / paused / disabled schedules
 * - Audit metadata
 *
 * ============================================================================
 */

"use strict";

const mongoose = require("mongoose");

/* ============================================================================
 * Constants
 * ========================================================================== */

const {
    REPORT_TYPES,
    REPORT_FORMATS,
    REPORT_PERIODS,
    REPORT_LIMITS,
    ANALYTICS_REPORTS,
    TEAM_REPORTS,
    EMAIL_REPORTS,
    EXECUTIVE_REPORTS,
} = require("../utils/reportConstants");

/* ============================================================================
 * Helpers
 * ========================================================================== */

const safeArray = (value) => {
    return Array.isArray(value) ? value : [];
};

const allowedReportNames = [
    ...safeArray(ANALYTICS_REPORTS),
    ...safeArray(TEAM_REPORTS),
    ...safeArray(EMAIL_REPORTS),
    ...safeArray(EXECUTIVE_REPORTS),
];

/* ============================================================================
 * Schedule History Schema
 * ========================================================================== */

const ReportScheduleExecutionSchema =
    new mongoose.Schema(
        {
            executionId: {
                type: String,
                required: true,
                index: true,
                trim: true,
                maxlength: 120,
            },

            startedAt: {
                type: Date,
                required: true,
            },

            completedAt: {
                type: Date,
                default: null,
            },

            status: {
                type: String,
                enum: [
                    "running",
                    "success",
                    "failed",
                    "skipped",
                ],
                default: "running",
                index: true,
            },

            format: {
                type: String,
                enum: Object.values(
                    REPORT_FORMATS
                ),
                required: true,
            },

            filename: {
                type: String,
                default: null,
                maxlength: 200,
            },

            size: {
                type: Number,
                default: 0,
                min: 0,
            },

            durationMs: {
                type: Number,
                default: 0,
                min: 0,
            },

            errorCode: {
                type: String,
                default: null,
                maxlength: 120,
            },

            errorMessage: {
                type: String,
                default: null,
                maxlength: 1000,
            },

            retryCount: {
                type: Number,
                default: 0,
                min: 0,
            },

            requestId: {
                type: String,
                default: null,
                maxlength: 120,
            },
        },
        {
            _id: false,
            timestamps: false,
        }
    );

/* ============================================================================
 * Main Report Schedule Schema
 * ========================================================================== */

const ReportScheduleSchema =
    new mongoose.Schema(
        {
            /* ----------------------------------------------------------------
             * Tenant
             * -------------------------------------------------------------- */

            tenantId: {
                type: String,
                required: true,
                index: true,
                trim: true,
                maxlength: 120,
            },

            /* ----------------------------------------------------------------
             * Owner
             * -------------------------------------------------------------- */

            createdBy: {
                type: String,
                default: null,
                index: true,
                trim: true,
                maxlength: 120,
            },

            updatedBy: {
                type: String,
                default: null,
                trim: true,
                maxlength: 120,
            },

            /* ----------------------------------------------------------------
             * Schedule Identity
             * -------------------------------------------------------------- */

            name: {
                type: String,
                required: true,
                trim: true,
                minlength: 1,
                maxlength: 180,
            },

            description: {
                type: String,
                default: "",
                trim: true,
                maxlength: 1000,
            },

            /* ----------------------------------------------------------------
             * Report Definition
             * -------------------------------------------------------------- */

            reportType: {
                type: String,
                required: true,
                enum: Object.values(
                    REPORT_TYPES
                ),
                index: true,
            },

            report: {
                type: String,
                default: null,
                trim: true,
                lowercase: true,
                maxlength: 120,
                validate: {
                    validator: function (value) {
                        if (!value) {
                            return true;
                        }

                        return allowedReportNames.includes(
                            value
                        );
                    },

                    message:
                        "Invalid report name.",
                },
            },

            format: {
                type: String,
                required: true,
                enum: Object.values(
                    REPORT_FORMATS
                ),
                default:
                    REPORT_FORMATS.PDF,
            },

            period: {
                type: String,
                required: true,
                enum: REPORT_PERIODS,
                default: "month",
            },

            /* ----------------------------------------------------------------
             * Report Filters
             * -------------------------------------------------------------- */

            filters: {
                month: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 30,
                },

                year: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 10,
                },

                search: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 200,
                },

                teamId: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 120,
                },

                department: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 120,
                },

                priority: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 120,
                },

                category: {
                    type: String,
                    default: null,
                    trim: true,
                    maxlength: 120,
                },
            },

            /* ----------------------------------------------------------------
             * Custom Date Range
             * -------------------------------------------------------------- */

            startDate: {
                type: Date,
                default: null,
            },

            endDate: {
                type: Date,
                default: null,
            },

            /* ----------------------------------------------------------------
             * Schedule Configuration
             * -------------------------------------------------------------- */

            scheduleType: {
                type: String,
                enum: [
                    "daily",
                    "weekly",
                    "monthly",
                    "custom",
                ],
                required: true,
                default: "monthly",
                index: true,
            },

            timezone: {
                type: String,
                default: "UTC",
                trim: true,
                maxlength: 80,
            },

            time: {
                type: String,
                required: true,
                default: "09:00",
                match: /^([01]\d|2[0-3]):[0-5]\d$/,
            },

            dayOfWeek: {
                type: Number,
                default: null,
                min: 0,
                max: 6,
            },

            dayOfMonth: {
                type: Number,
                default: null,
                min: 1,
                max: 31,
            },

            intervalMinutes: {
                type: Number,
                default: null,
                min: 1,
                max: 525600,
            },

            customCron: {
                type: String,
                default: null,
                trim: true,
                maxlength: 120,
            },

            /* ----------------------------------------------------------------
             * Schedule State
             * -------------------------------------------------------------- */

            enabled: {
                type: Boolean,
                default: true,
                index: true,
            },

            status: {
                type: String,
                enum: [
                    "active",
                    "paused",
                    "disabled",
                    "completed",
                    "failed",
                ],
                default: "active",
                index: true,
            },

            /* ----------------------------------------------------------------
             * Runtime
             * -------------------------------------------------------------- */

            nextRunAt: {
                type: Date,
                default: null,
                index: true,
            },

            lastRunAt: {
                type: Date,
                default: null,
            },

            lastSuccessAt: {
                type: Date,
                default: null,
            },

            lastFailureAt: {
                type: Date,
                default: null,
            },

            lastExecutionStatus: {
                type: String,
                enum: [
                    "success",
                    "failed",
                    "skipped",
                    "running",
                    null,
                ],
                default: null,
            },

            consecutiveFailures: {
                type: Number,
                default: 0,
                min: 0,
            },

            totalRuns: {
                type: Number,
                default: 0,
                min: 0,
            },

            successfulRuns: {
                type: Number,
                default: 0,
                min: 0,
            },

            failedRuns: {
                type: Number,
                default: 0,
                min: 0,
            },

            /* ----------------------------------------------------------------
             * Distributed Lock
             * -------------------------------------------------------------- */

            lock: {
                executionId: {
                    type: String,
                    default: null,
                    maxlength: 120,
                },

                lockedAt: {
                    type: Date,
                    default: null,
                },

                lockedUntil: {
                    type: Date,
                    default: null,
                },

                lockedBy: {
                    type: String,
                    default: null,
                    maxlength: 120,
                },
            },

            /* ----------------------------------------------------------------
             * Execution History
             * -------------------------------------------------------------- */

            executionHistory: {
                type: [ReportScheduleExecutionSchema],
                default: [],
            },

            /* ----------------------------------------------------------------
             * Audit
             * -------------------------------------------------------------- */

            createdAt: {
                type: Date,
                default: Date.now,
            },

            updatedAt: {
                type: Date,
                default: Date.now,
            },
        },
        {
            versionKey: false,
            minimize: false,
        }
    );

/* ============================================================================
 * Indexes
 * ========================================================================== */

ReportScheduleSchema.index({
    tenantId: 1,
    enabled: 1,
    status: 1,
    nextRunAt: 1,
});

ReportScheduleSchema.index({
    tenantId: 1,
    name: 1,
});

ReportScheduleSchema.index({
    tenantId: 1,
    reportType: 1,
});

ReportScheduleSchema.index({
    "lock.lockedUntil": 1,
});

/* ============================================================================
 * Middleware
 * ========================================================================== */

ReportScheduleSchema.pre(
    "save",
    function (next) {
        this.updatedAt = new Date();
        next();
    }
);

/* ============================================================================
 * JSON Transformation
 * ========================================================================== */

ReportScheduleSchema.set(
    "toJSON",
    {
        transform: (
            doc,
            ret
        ) => {
            delete ret.__v;

            if (ret.lock) {
                ret.lock = {
                    locked:
                        Boolean(
                            ret.lock.lockedUntil &&
                            new Date(
                                ret.lock.lockedUntil
                            ) > new Date()
                        ),
                    lockedAt:
                        ret.lock.lockedAt,
                    lockedUntil:
                        ret.lock.lockedUntil,
                    lockedBy:
                        ret.lock.lockedBy,
                };
            }

            return ret;
        },
    }
);

/* ============================================================================
 * Model
 * ========================================================================== */

module.exports =
    mongoose.models.ReportSchedule ||
    mongoose.model(
        "ReportSchedule",
        ReportScheduleSchema
    );

/**
 * ============================================================================
 * End ReportSchedule.js
 * ============================================================================
 */
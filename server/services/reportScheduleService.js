/**
 * ============================================================================
 * reportScheduleService.js
 * Phase 10.7.2 — Enterprise Report Scheduling Service
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 */

"use strict";

const mongoose = require("mongoose");

const ReportSchedule = require("../models/ReportSchedule");

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
 * Report Service
 * ========================================================================== */

let reportService = null;

try {
    reportService = require("./reportService");
} catch (error) {
    console.warn(
        "[ReportScheduleService] reportService unavailable:",
        error.message
    );
}

/* ============================================================================
 * Constants
 * ========================================================================== */

const MODULE_NAME = "ReportScheduleService";
const API_VERSION = "1.0.0";

const DEFAULT_TIME = "09:00";
const DEFAULT_TIMEZONE = "UTC";
const DEFAULT_SCHEDULE_TYPE = "monthly";
const DEFAULT_STATUS = "active";

const LOCK_DURATION_MS = 10 * 60 * 1000;

const MAX_HISTORY_ENTRIES = Number(
    REPORT_LIMITS?.MAX_EXECUTION_HISTORY || 50
);

/* ============================================================================
 * Error Factory
 * ========================================================================== */

const createServiceError = (
    message,
    code = "REPORT_SCHEDULE_SERVICE_ERROR",
    status = 500,
    details = null
) => {
    const error = new Error(message);

    error.code = code;
    error.status = status;
    error.details = details;

    return error;
};

/* ============================================================================
 * String Helpers
 * ========================================================================== */

const normalizeString = (value, fallback = "") => {
    if (typeof value !== "string") {
        return fallback;
    }

    return value.trim();
};

const normalizeLower = (value, fallback = "") => {
    return normalizeString(value, fallback).toLowerCase();
};

/* ============================================================================
 * ObjectId Validation
 * ========================================================================== */

const validateObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

/* ============================================================================
 * Tenant Validation
 * ========================================================================== */

const requireTenant = (tenantId) => {
    const normalizedTenant = normalizeString(tenantId);

    if (!normalizedTenant) {
        throw createServiceError(
            "Tenant context is required.",
            "REPORT_SCHEDULE_TENANT_REQUIRED",
            401
        );
    }

    if (normalizedTenant.length > 120) {
        throw createServiceError(
            "Tenant ID exceeds the maximum allowed length.",
            "REPORT_SCHEDULE_TENANT_INVALID",
            400
        );
    }

    return normalizedTenant;
};

/* ============================================================================
 * Report Definition Validation
 * ========================================================================== */

const validateReportDefinition = (
    reportType,
    report
) => {
    const type = normalizeLower(reportType);
    const reportName = normalizeLower(report);

    if (!Object.values(REPORT_TYPES).includes(type)) {
        throw createServiceError(
            `Unsupported report type: ${type || "empty"}`,
            "REPORT_TYPE_INVALID",
            400
        );
    }

    if (!reportName) {
        return {
            reportType: type,
            report: null,
        };
    }

    let allowedReports = [];

    switch (type) {
        case REPORT_TYPES.ANALYTICS:
            allowedReports = Array.isArray(ANALYTICS_REPORTS)
                ? ANALYTICS_REPORTS
                : [];
            break;

        case REPORT_TYPES.TEAM:
            allowedReports = Array.isArray(TEAM_REPORTS)
                ? TEAM_REPORTS
                : [];
            break;

        case REPORT_TYPES.EMAIL:
            allowedReports = Array.isArray(EMAIL_REPORTS)
                ? EMAIL_REPORTS
                : [];
            break;

        case REPORT_TYPES.EXECUTIVE:
            allowedReports = Array.isArray(EXECUTIVE_REPORTS)
                ? EXECUTIVE_REPORTS
                : [];
            break;

        default:
            allowedReports = [];
    }

    if (
        allowedReports.length > 0 &&
        !allowedReports.includes(reportName)
    ) {
        throw createServiceError(
            `Unsupported report "${reportName}" for report type "${type}".`,
            "REPORT_NAME_INVALID",
            400
        );
    }

    return {
        reportType: type,
        report: reportName,
    };
};

/* ============================================================================
 * Format Validation
 * ========================================================================== */

const validateFormat = (format) => {
    const normalized = normalizeLower(
        format,
        REPORT_FORMATS.PDF
    );

    if (!Object.values(REPORT_FORMATS).includes(normalized)) {
        throw createServiceError(
            `Unsupported report format: ${normalized}`,
            "REPORT_FORMAT_INVALID",
            400
        );
    }

    return normalized;
};

/* ============================================================================
 * Period Validation
 * ========================================================================== */

const validatePeriod = (period) => {
    const normalized = normalizeLower(
        period,
        "month"
    );

    if (!REPORT_PERIODS.includes(normalized)) {
        throw createServiceError(
            `Unsupported report period: ${normalized}`,
            "REPORT_PERIOD_INVALID",
            400
        );
    }

    return normalized;
};

/* ============================================================================
 * Schedule Type Validation
 * ========================================================================== */

const validateScheduleType = (scheduleType) => {
    const normalized = normalizeLower(
        scheduleType,
        DEFAULT_SCHEDULE_TYPE
    );

    const allowed = [
        "daily",
        "weekly",
        "monthly",
        "custom",
    ];

    if (!allowed.includes(normalized)) {
        throw createServiceError(
            `Unsupported schedule type: ${normalized}`,
            "REPORT_SCHEDULE_TYPE_INVALID",
            400
        );
    }

    return normalized;
};

/* ============================================================================
 * Time Validation
 * ========================================================================== */

const validateTime = (time) => {
    const normalized = normalizeString(
        time,
        DEFAULT_TIME
    );

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized)) {
        throw createServiceError(
            "Schedule time must use HH:mm format.",
            "REPORT_SCHEDULE_TIME_INVALID",
            400
        );
    }

    return normalized;
};

/* ============================================================================
 * Day Validation
 * ========================================================================== */

const validateDayConfiguration = (options) => {
    const scheduleType = options.scheduleType;

    if (scheduleType === "weekly") {
        if (
            options.dayOfWeek === null ||
            options.dayOfWeek === undefined
        ) {
            throw createServiceError(
                "dayOfWeek is required for weekly schedules.",
                "REPORT_SCHEDULE_DAY_OF_WEEK_REQUIRED",
                400
            );
        }

        const dayOfWeek = Number(options.dayOfWeek);

        if (
            !Number.isInteger(dayOfWeek) ||
            dayOfWeek < 0 ||
            dayOfWeek > 6
        ) {
            throw createServiceError(
                "dayOfWeek must be between 0 and 6.",
                "REPORT_SCHEDULE_DAY_OF_WEEK_INVALID",
                400
            );
        }
    }

    if (scheduleType === "monthly") {
        if (
            options.dayOfMonth === null ||
            options.dayOfMonth === undefined
        ) {
            throw createServiceError(
                "dayOfMonth is required for monthly schedules.",
                "REPORT_SCHEDULE_DAY_OF_MONTH_REQUIRED",
                400
            );
        }

        const dayOfMonth = Number(options.dayOfMonth);

        if (
            !Number.isInteger(dayOfMonth) ||
            dayOfMonth < 1 ||
            dayOfMonth > 31
        ) {
            throw createServiceError(
                "dayOfMonth must be between 1 and 31.",
                "REPORT_SCHEDULE_DAY_OF_MONTH_INVALID",
                400
            );
        }
    }

    if (scheduleType === "custom") {
        if (
            !options.intervalMinutes &&
            !options.customCron
        ) {
            throw createServiceError(
                "Custom schedules require intervalMinutes or customCron.",
                "REPORT_SCHEDULE_CUSTOM_CONFIGURATION_REQUIRED",
                400
            );
        }

        if (
            options.intervalMinutes &&
            options.customCron
        ) {
            throw createServiceError(
                "Use either intervalMinutes or customCron, not both.",
                "REPORT_SCHEDULE_CUSTOM_CONFIGURATION_INVALID",
                400
            );
        }
    }
};

/* ============================================================================
 * Date Validation
 * ========================================================================== */

const validateDateRange = (
    startDate,
    endDate,
    period
) => {
    let start = null;
    let end = null;

    if (startDate) {
        start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
            throw createServiceError(
                "Invalid schedule startDate.",
                "REPORT_SCHEDULE_START_DATE_INVALID",
                400
            );
        }
    }

    if (endDate) {
        end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
            throw createServiceError(
                "Invalid schedule endDate.",
                "REPORT_SCHEDULE_END_DATE_INVALID",
                400
            );
        }
    }

    if (
        period === "custom" &&
        (!start || !end)
    ) {
        throw createServiceError(
            "startDate and endDate are required for custom report periods.",
            "REPORT_SCHEDULE_CUSTOM_DATE_REQUIRED",
            400
        );
    }

    if (start && end && start > end) {
        throw createServiceError(
            "Schedule startDate cannot be after endDate.",
            "REPORT_SCHEDULE_DATE_RANGE_INVALID",
            400
        );
    }

    if (
        start &&
        end &&
        REPORT_LIMITS?.MAX_DATE_RANGE_DAYS
    ) {
        const rangeDays = Math.ceil(
            (
                end.getTime() -
                start.getTime()
            ) /
            (1000 * 60 * 60 * 24)
        );

        if (
            rangeDays >
            REPORT_LIMITS.MAX_DATE_RANGE_DAYS
        ) {
            throw createServiceError(
                `Schedule date range cannot exceed ${REPORT_LIMITS.MAX_DATE_RANGE_DAYS} days.`,
                "REPORT_SCHEDULE_DATE_RANGE_TOO_LARGE",
                400
            );
        }
    }

    return {
        startDate: start,
        endDate: end,
    };
};

/* ============================================================================
 * Filter Normalization
 * ========================================================================== */

const normalizeFilters = (filters = {}) => {
    const normalized = {
        month: normalizeString(filters.month) || null,
        year: normalizeString(filters.year) || null,
        search: normalizeString(filters.search) || null,
        teamId: normalizeString(filters.teamId) || null,
        department: normalizeString(filters.department) || null,
        priority: normalizeString(filters.priority) || null,
        category: normalizeString(filters.category) || null,
    };

    Object.entries(normalized).forEach(
        ([key, value]) => {
            if (value && value.length > 200) {
                throw createServiceError(
                    `Filter "${key}" exceeds the maximum allowed length.`,
                    "REPORT_SCHEDULE_FILTER_TOO_LONG",
                    400
                );
            }
        }
    );

    return normalized;
};

/* ============================================================================
 * Normalize Schedule Input
 * ========================================================================== */

const normalizeScheduleInput = (input = {}) => {
    const tenantId = requireTenant(input.tenantId);

    const reportDefinition =
        validateReportDefinition(
            input.reportType || input.type,
            input.report
        );

    const format = validateFormat(input.format);
    const period = validatePeriod(input.period);
    const scheduleType =
        validateScheduleType(input.scheduleType);

    const time = validateTime(input.time);

    const {
        startDate,
        endDate,
    } = validateDateRange(
        input.startDate,
        input.endDate,
        period
    );

    const normalized = {
        tenantId,

        createdBy:
            normalizeString(input.createdBy) || null,

        updatedBy:
            normalizeString(input.updatedBy) || null,

        name:
            normalizeString(input.name),

        description:
            normalizeString(input.description),

        reportType:
            reportDefinition.reportType,

        report:
            reportDefinition.report,

        format,

        period,

        filters:
            normalizeFilters(input.filters),

        startDate,
        endDate,

        scheduleType,

        timezone:
            normalizeString(
                input.timezone,
                DEFAULT_TIMEZONE
            ),

        time,

        dayOfWeek:
            input.dayOfWeek !== undefined &&
            input.dayOfWeek !== null
                ? Number(input.dayOfWeek)
                : null,

        dayOfMonth:
            input.dayOfMonth !== undefined &&
            input.dayOfMonth !== null
                ? Number(input.dayOfMonth)
                : null,

        intervalMinutes:
            input.intervalMinutes !== undefined &&
            input.intervalMinutes !== null
                ? Number(input.intervalMinutes)
                : null,

        customCron:
            normalizeString(input.customCron) || null,

        enabled:
            input.enabled !== undefined
                ? Boolean(input.enabled)
                : true,

        status:
            normalizeLower(
                input.status,
                DEFAULT_STATUS
            ),
    };

    if (!normalized.name) {
        throw createServiceError(
            "Schedule name is required.",
            "REPORT_SCHEDULE_NAME_REQUIRED",
            400
        );
    }

    if (normalized.name.length > 180) {
        throw createServiceError(
            "Schedule name cannot exceed 180 characters.",
            "REPORT_SCHEDULE_NAME_TOO_LONG",
            400
        );
    }

    validateDayConfiguration(normalized);

    if (
        normalized.intervalMinutes !== null &&
        (
            !Number.isInteger(
                normalized.intervalMinutes
            ) ||
            normalized.intervalMinutes < 1 ||
            normalized.intervalMinutes > 525600
        )
    ) {
        throw createServiceError(
            "intervalMinutes must be between 1 and 525600.",
            "REPORT_SCHEDULE_INTERVAL_INVALID",
            400
        );
    }

    return normalized;
};

/* ============================================================================
 * Timezone Helpers
 * ========================================================================== */

const getTimeZoneParts = (
    date,
    timezone
) => {
    try {
        const formatter =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    timeZone: timezone,
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hourCycle: "h23",
                }
            );

        const parts =
            formatter.formatToParts(date);

        const result = {};

        for (const part of parts) {
            if (part.type !== "literal") {
                result[part.type] =
                    Number(part.value);
            }
        }

        return result;
    } catch (error) {
        throw createServiceError(
            `Invalid timezone: ${timezone}`,
            "REPORT_SCHEDULE_TIMEZONE_INVALID",
            400
        );
    }
};

/* ============================================================================
 * Timezone Offset
 * ========================================================================== */

const getTimezoneOffsetMs = (
    date,
    timezone
) => {
    const parts =
        getTimeZoneParts(
            date,
            timezone
        );

    const utcTime =
        Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second
        );

    return utcTime - date.getTime();
};

/* ============================================================================
 * Build Date In Timezone
 * ========================================================================== */

const buildDateInTimezone = (
    year,
    month,
    day,
    hour,
    minute,
    timezone
) => {
    let guess =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day,
                hour,
                minute,
                0,
                0
            )
        );

    for (let i = 0; i < 4; i += 1) {
        const offset =
            getTimezoneOffsetMs(
                guess,
                timezone
            );

        guess =
            new Date(
                Date.UTC(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    0,
                    0
                ) - offset
            );
    }

    return guess;
};

/* ============================================================================
 * Parse Time
 * ========================================================================== */

const parseTime = (time) => {
    const [hour, minute] =
        String(time || DEFAULT_TIME)
            .split(":")
            .map(Number);

    return {
        hour,
        minute,
    };
};

/* ============================================================================
 * Daily Next Run
 * ========================================================================== */

const calculateDailyNextRun = (
    fromDate,
    schedule
) => {
    const timezone =
        schedule.timezone ||
        DEFAULT_TIMEZONE;

    const {
        hour,
        minute,
    } = parseTime(schedule.time);

    const parts =
        getTimeZoneParts(
            fromDate,
            timezone
        );

    let candidate =
        buildDateInTimezone(
            parts.year,
            parts.month,
            parts.day,
            hour,
            minute,
            timezone
        );

    if (candidate <= fromDate) {
        candidate =
            buildDateInTimezone(
                parts.year,
                parts.month,
                parts.day + 1,
                hour,
                minute,
                timezone
            );
    }

    return candidate;
};

/* ============================================================================
 * Weekly Next Run
 * ========================================================================== */

const calculateWeeklyNextRun = (
    fromDate,
    schedule
) => {
    const timezone =
        schedule.timezone ||
        DEFAULT_TIME;

    const {
        hour,
        minute,
    } = parseTime(schedule.time);

    const targetDay =
        Number(schedule.dayOfWeek);

    const currentParts =
        getTimeZoneParts(
            fromDate,
            timezone
        );

    const currentDate =
        buildDateInTimezone(
            currentParts.year,
            currentParts.month,
            currentParts.day,
            hour,
            minute,
            timezone
        );

    const currentDay =
        new Date(
            currentDate
        ).getUTCDay();

    let daysUntil =
        targetDay - currentDay;

    if (daysUntil < 0) {
        daysUntil += 7;
    }

    let candidate =
        buildDateInTimezone(
            currentParts.year,
            currentParts.month,
            currentParts.day + daysUntil,
            hour,
            minute,
            timezone
        );

    if (candidate <= fromDate) {
        candidate =
            buildDateInTimezone(
                currentParts.year,
                currentParts.month,
                currentParts.day +
                    daysUntil +
                    7,
                hour,
                minute,
                timezone
            );
    }

    return candidate;
};

/* ============================================================================
 * Days In Month
 * ========================================================================== */

const daysInMonth = (
    year,
    month
) => {
    return new Date(
        Date.UTC(
            year,
            month,
            0
        )
    ).getUTCDate();
};

/* ============================================================================
 * Monthly Next Run
 * ========================================================================== */

const calculateMonthlyNextRun = (
    fromDate,
    schedule
) => {
    const timezone =
        schedule.timezone ||
        DEFAULT_TIMEZONE;

    const {
        hour,
        minute,
    } = parseTime(schedule.time);

    const targetDay =
        Number(schedule.dayOfMonth);

    const parts =
        getTimeZoneParts(
            fromDate,
            timezone
        );

    let year = parts.year;
    let month = parts.month;

    const buildCandidate = () => {
        const day =
            Math.min(
                targetDay,
                daysInMonth(
                    year,
                    month
                )
            );

        return buildDateInTimezone(
            year,
            month,
            day,
            hour,
            minute,
            timezone
        );
    };

    let candidate =
        buildCandidate();

    if (candidate <= fromDate) {
        month += 1;

        if (month > 12) {
            month = 1;
            year += 1;
        }

        candidate =
            buildCandidate();
    }

    return candidate;
};

/* ============================================================================
 * Custom Interval
 * ========================================================================== */

const calculateCustomIntervalNextRun = (
    fromDate,
    schedule
) => {
    const interval =
        Number(
            schedule.intervalMinutes
        );

    if (
        !Number.isInteger(interval) ||
        interval < 1
    ) {
        throw createServiceError(
            "intervalMinutes is required for interval-based custom schedules.",
            "REPORT_SCHEDULE_INTERVAL_REQUIRED",
            400
        );
    }

    return new Date(
        fromDate.getTime() +
        interval * 60 * 1000
    );
};

/* ============================================================================
 * Custom Cron
 * ========================================================================== */

const calculateCustomCronNextRun = (
    fromDate,
    schedule
) => {
    if (!schedule.customCron) {
        throw createServiceError(
            "customCron is required for cron-based custom schedules.",
            "REPORT_SCHEDULE_CRON_REQUIRED",
            400
        );
    }

    let cronParser;

    try {
        cronParser =
            require("cron-parser");
    } catch (error) {
        throw createServiceError(
            "cron-parser is required for customCron schedules.",
            "REPORT_SCHEDULE_CRON_PARSER_REQUIRED",
            503
        );
    }

    try {
        /*
         * Supports cron-parser versions exposing parseExpression().
         */
        if (
            typeof cronParser.parseExpression ===
            "function"
        ) {
            const expression =
                cronParser.parseExpression(
                    schedule.customCron,
                    {
                        currentDate: fromDate,
                        tz:
                            schedule.timezone ||
                            DEFAULT_TIMEZONE,
                    }
                );

            return expression.next().toDate();
        }

        /*
         * Supports newer cron-parser API.
         */
        if (
            typeof cronParser.parse ===
            "function"
        ) {
            const expression =
                cronParser.parse(
                    schedule.customCron,
                    {
                        currentDate: fromDate,
                        tz:
                            schedule.timezone ||
                            DEFAULT_TIMEZONE,
                    }
                );

            return expression.next().toDate();
        }

        throw new Error(
            "Unsupported cron-parser API."
        );
    } catch (error) {
        throw createServiceError(
            `Invalid customCron expression: ${schedule.customCron}`,
            "REPORT_SCHEDULE_CRON_INVALID",
            400,
            {
                originalError:
                    error.message,
            }
        );
    }
};

/* ============================================================================
 * Calculate Next Run
 * ========================================================================== */

const calculateNextRun = (
    schedule,
    fromDate = new Date()
) => {
    if (!schedule) {
        throw createServiceError(
            "Schedule is required.",
            "REPORT_SCHEDULE_REQUIRED",
            400
        );
    }

    const scheduleType =
        validateScheduleType(
            schedule.scheduleType
        );

    const referenceDate =
        new Date(fromDate);

    if (
        Number.isNaN(
            referenceDate.getTime()
        )
    ) {
        throw createServiceError(
            "Invalid reference date.",
            "REPORT_SCHEDULE_REFERENCE_DATE_INVALID",
            400
        );
    }

    switch (scheduleType) {
        case "daily":
            return calculateDailyNextRun(
                referenceDate,
                schedule
            );

        case "weekly":
            return calculateWeeklyNextRun(
                referenceDate,
                schedule
            );

        case "monthly":
            return calculateMonthlyNextRun(
                referenceDate,
                schedule
            );

        case "custom":
            if (schedule.customCron) {
                return calculateCustomCronNextRun(
                    referenceDate,
                    schedule
                );
            }

            return calculateCustomIntervalNextRun(
                referenceDate,
                schedule
            );

        default:
            throw createServiceError(
                "Unsupported schedule type.",
                "REPORT_SCHEDULE_TYPE_INVALID",
                400
            );
    }
};

/* ============================================================================
 * Build Schedule Document
 * ========================================================================== */

const buildScheduleDocument = (
    input
) => {
    const normalized =
        normalizeScheduleInput(
            input
        );

    if (
        normalized.status === "paused" ||
        normalized.status === "disabled"
    ) {
        normalized.enabled = false;
    }

    let nextRunAt = null;

    if (
        normalized.enabled &&
        normalized.status === "active"
    ) {
        nextRunAt =
            calculateNextRun(
                normalized,
                new Date()
            );
    }

    return {
        ...normalized,

        nextRunAt,

        lastRunAt: null,
        lastSuccessAt: null,
        lastFailureAt: null,
        lastExecutionStatus: null,

        consecutiveFailures: 0,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,

        lock: {
            executionId: null,
            lockedAt: null,
            lockedUntil: null,
            lockedBy: null,
        },

        executionHistory: [],
    };
};

/* ============================================================================
 * Create Schedule
 * ========================================================================== */

const createSchedule = async (
    input = {}
) => {
    try {
        const normalized =
            normalizeScheduleInput(
                input
            );

        const existing =
            await ReportSchedule.findOne({
                tenantId:
                    normalized.tenantId,

                name:
                    normalized.name,
            }).lean();

        if (existing) {
            throw createServiceError(
                "A report schedule with this name already exists for the tenant.",
                "REPORT_SCHEDULE_NAME_EXISTS",
                409
            );
        }

        const scheduleData =
            buildScheduleDocument(
                normalized
            );

        const schedule =
            await ReportSchedule.create(
                scheduleData
            );

        return {
            success: true,
            message:
                "Report schedule created successfully.",
            data: schedule,
            error: null,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error.message ||
                "Unable to create report schedule.",
            data: null,
            error,
            status:
                error.status ||
                500,
        };
    }
};

/* ============================================================================
 * Get Schedule
 * ========================================================================== */

const getSchedule = async (
    scheduleId,
    tenantId
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    if (!validateObjectId(scheduleId)) {
        throw createServiceError(
            "Invalid schedule ID.",
            "REPORT_SCHEDULE_ID_INVALID",
            400
        );
    }

    const schedule =
        await ReportSchedule.findOne({
            _id: scheduleId,
            tenantId: normalizedTenant,
        });

    if (!schedule) {
        throw createServiceError(
            "Report schedule not found.",
            "REPORT_SCHEDULE_NOT_FOUND",
            404
        );
    }

    return schedule;
};

/* ============================================================================
 * List Schedules
 * ========================================================================== */

const listSchedules = async (
    options = {}
) => {
    const tenantId =
        requireTenant(
            options.tenantId
        );

    const filter = {
        tenantId,
    };

    if (options.status) {
        filter.status =
            normalizeLower(
                options.status
            );
    }

    if (options.reportType) {
        filter.reportType =
            normalizeLower(
                options.reportType
            );
    }

    if (
        options.enabled !==
        undefined
    ) {
        filter.enabled =
            Boolean(
                options.enabled
            );
    }

    const limit =
        Math.min(
            Math.max(
                Number(
                    options.limit || 50
                ),
                1
            ),
            500
        );

    const page =
        Math.max(
            Number(
                options.page || 1
            ),
            1
        );

    const skip =
        (page - 1) *
        limit;

    const [
        schedules,
        total,
    ] = await Promise.all([
        ReportSchedule
            .find(filter)
            .sort({
                nextRunAt: 1,
                createdAt: -1,
            })
            .skip(skip)
            .limit(limit),

        ReportSchedule.countDocuments(
            filter
        ),
    ]);

    return {
        success: true,
        message:
            "Report schedules loaded successfully.",
        data: {
            schedules,
            pagination: {
                page,
                limit,
                total,
                pages:
                    Math.ceil(
                        total / limit
                    ),
            },
        },
        error: null,
    };
};

/* ============================================================================
 * Update Schedule
 * ========================================================================== */

const updateSchedule = async (
    scheduleId,
    tenantId,
    updates = {}
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    if (!validateObjectId(scheduleId)) {
        throw createServiceError(
            "Invalid schedule ID.",
            "REPORT_SCHEDULE_ID_INVALID",
            400
        );
    }

    const existing =
        await ReportSchedule.findOne({
            _id: scheduleId,
            tenantId: normalizedTenant,
        });

    if (!existing) {
        throw createServiceError(
            "Report schedule not found.",
            "REPORT_SCHEDULE_NOT_FOUND",
            404
        );
    }

    const merged = {
        tenantId: normalizedTenant,

        createdBy:
            existing.createdBy,

        updatedBy:
            updates.updatedBy !==
            undefined
                ? updates.updatedBy
                : existing.updatedBy,

        name:
            updates.name !== undefined
                ? updates.name
                : existing.name,

        description:
            updates.description !== undefined
                ? updates.description
                : existing.description,

        reportType:
            updates.reportType !== undefined
                ? updates.reportType
                : existing.reportType,

        report:
            updates.report !== undefined
                ? updates.report
                : existing.report,

        format:
            updates.format !== undefined
                ? updates.format
                : existing.format,

        period:
            updates.period !== undefined
                ? updates.period
                : existing.period,

        filters:
            updates.filters !== undefined
                ? updates.filters
                : existing.filters,

        startDate:
            updates.startDate !== undefined
                ? updates.startDate
                : existing.startDate,

        endDate:
            updates.endDate !== undefined
                ? updates.endDate
                : existing.endDate,

        scheduleType:
            updates.scheduleType !== undefined
                ? updates.scheduleType
                : existing.scheduleType,

        timezone:
            updates.timezone !== undefined
                ? updates.timezone
                : existing.timezone,

        time:
            updates.time !== undefined
                ? updates.time
                : existing.time,

        dayOfWeek:
            updates.dayOfWeek !== undefined
                ? updates.dayOfWeek
                : existing.dayOfWeek,

        dayOfMonth:
            updates.dayOfMonth !== undefined
                ? updates.dayOfMonth
                : existing.dayOfMonth,

        intervalMinutes:
            updates.intervalMinutes !== undefined
                ? updates.intervalMinutes
                : existing.intervalMinutes,

        customCron:
            updates.customCron !== undefined
                ? updates.customCron
                : existing.customCron,

        enabled:
            updates.enabled !== undefined
                ? Boolean(updates.enabled)
                : existing.enabled,

        status:
            updates.status !== undefined
                ? updates.status
                : existing.status,
    };

    const normalized =
        normalizeScheduleInput(
            merged
        );

    existing.name =
        normalized.name;

    existing.description =
        normalized.description;

    existing.reportType =
        normalized.reportType;

    existing.report =
        normalized.report;

    existing.format =
        normalized.format;

    existing.period =
        normalized.period;

    existing.filters =
        normalized.filters;

    existing.startDate =
        normalized.startDate;

    existing.endDate =
        normalized.endDate;

    existing.scheduleType =
        normalized.scheduleType;

    existing.timezone =
        normalized.timezone;

    existing.time =
        normalized.time;

    existing.dayOfWeek =
        normalized.dayOfWeek;

    existing.dayOfMonth =
        normalized.dayOfMonth;

    existing.intervalMinutes =
        normalized.intervalMinutes;

    existing.customCron =
        normalized.customCron;

    existing.enabled =
        normalized.enabled;

    existing.status =
        normalized.status;

    existing.updatedBy =
        normalized.updatedBy;

    if (
        existing.enabled &&
        existing.status === "active"
    ) {
        existing.nextRunAt =
            calculateNextRun(
                existing,
                new Date()
            );
    } else {
        existing.nextRunAt = null;
    }

    existing.updatedAt =
        new Date();

    await existing.save();

    return {
        success: true,
        message:
            "Report schedule updated successfully.",
        data: existing,
        error: null,
    };
};

/* ============================================================================
 * Delete Schedule
 * ========================================================================== */

const deleteSchedule = async (
    scheduleId,
    tenantId
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    if (!validateObjectId(scheduleId)) {
        throw createServiceError(
            "Invalid schedule ID.",
            "REPORT_SCHEDULE_ID_INVALID",
            400
        );
    }

    const deleted =
        await ReportSchedule.findOneAndDelete({
            _id: scheduleId,
            tenantId: normalizedTenant,
        });

    if (!deleted) {
        throw createServiceError(
            "Report schedule not found.",
            "REPORT_SCHEDULE_NOT_FOUND",
            404
        );
    }

    return {
        success: true,
        message:
            "Report schedule deleted successfully.",
        data: deleted,
        error: null,
    };
};

/* ============================================================================
 * Pause
 * ========================================================================== */

const pauseSchedule = async (
    scheduleId,
    tenantId,
    updatedBy = null
) => {
    const schedule =
        await getSchedule(
            scheduleId,
            tenantId
        );

    schedule.status = "paused";
    schedule.enabled = false;
    schedule.nextRunAt = null;

    schedule.updatedBy =
        updatedBy ||
        schedule.updatedBy ||
        null;

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Report schedule paused successfully.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Resume
 * ========================================================================== */

const resumeSchedule = async (
    scheduleId,
    tenantId,
    updatedBy = null
) => {
    const schedule =
        await getSchedule(
            scheduleId,
            tenantId
        );

    schedule.status = "active";
    schedule.enabled = true;

    schedule.nextRunAt =
        calculateNextRun(
            schedule,
            new Date()
        );

    schedule.updatedBy =
        updatedBy ||
        schedule.updatedBy ||
        null;

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Report schedule resumed successfully.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Disable
 * ========================================================================== */

const disableSchedule = async (
    scheduleId,
    tenantId,
    updatedBy = null
) => {
    const schedule =
        await getSchedule(
            scheduleId,
            tenantId
        );

    schedule.status = "disabled";
    schedule.enabled = false;
    schedule.nextRunAt = null;

    schedule.updatedBy =
        updatedBy ||
        schedule.updatedBy ||
        null;

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Report schedule disabled successfully.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Enable
 * ========================================================================== */

const enableSchedule = async (
    scheduleId,
    tenantId,
    updatedBy = null
) => {
    const schedule =
        await getSchedule(
            scheduleId,
            tenantId
        );

    schedule.status = "active";
    schedule.enabled = true;

    schedule.nextRunAt =
        calculateNextRun(
            schedule,
            new Date()
        );

    schedule.updatedBy =
        updatedBy ||
        schedule.updatedBy ||
        null;

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Report schedule enabled successfully.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Refresh Next Run
 * ========================================================================== */

const refreshNextRun = async (
    schedule
) => {
    if (!schedule) {
        throw createServiceError(
            "Schedule is required.",
            "REPORT_SCHEDULE_REQUIRED",
            400
        );
    }

    if (
        !schedule.enabled ||
        schedule.status !== "active"
    ) {
        schedule.nextRunAt = null;
        return schedule;
    }

    schedule.nextRunAt =
        calculateNextRun(
            schedule,
            new Date()
        );

    schedule.updatedAt =
        new Date();

    return schedule;
};

/* ============================================================================
 * Find Due Schedules
 * ========================================================================== */

const findDueSchedules = async (
    options = {}
) => {
    const now =
        options.now
            ? new Date(options.now)
            : new Date();

    const limit =
        Math.min(
            Math.max(
                Number(
                    options.limit || 20
                ),
                1
            ),
            100
        );

    const filter = {
        enabled: true,
        status: "active",

        nextRunAt: {
            $lte: now,
        },

        $or: [
            {
                "lock.lockedUntil": {
                    $exists: false,
                },
            },
            {
                "lock.lockedUntil": null,
            },
            {
                "lock.lockedUntil": {
                    $lte: now,
                },
            },
        ],
    };

    if (options.tenantId) {
        filter.tenantId =
            requireTenant(
                options.tenantId
            );
    }

    return ReportSchedule
        .find(filter)
        .sort({
            nextRunAt: 1,
        })
        .limit(limit);
};

/* ============================================================================
 * Acquire Distributed Execution Lock
 * ========================================================================== */

const acquireExecutionLock = async (
    scheduleId,
    options = {}
) => {
    const executionId =
        normalizeString(
            options.executionId
        );

    const workerId =
        normalizeString(
            options.workerId,
            "report-scheduler"
        );

    const tenantId =
        requireTenant(
            options.tenantId
        );

    if (!executionId) {
        throw createServiceError(
            "executionId is required.",
            "REPORT_EXECUTION_ID_REQUIRED",
            400
        );
    }

    if (!validateObjectId(scheduleId)) {
        throw createServiceError(
            "Invalid schedule ID.",
            "REPORT_SCHEDULE_ID_INVALID",
            400
        );
    }

    const now = new Date();

    const lockedUntil =
        new Date(
            now.getTime() +
            LOCK_DURATION_MS
        );

    return ReportSchedule.findOneAndUpdate(
        {
            _id: scheduleId,
            tenantId,

            enabled: true,
            status: "active",

            nextRunAt: {
                $lte: now,
            },

            $or: [
                {
                    "lock.lockedUntil": {
                        $exists: false,
                    },
                },
                {
                    "lock.lockedUntil": null,
                },
                {
                    "lock.lockedUntil": {
                        $lte: now,
                    },
                },
            ],
        },
        {
            $set: {
                "lock.executionId":
                    executionId,

                "lock.lockedAt":
                    now,

                "lock.lockedUntil":
                    lockedUntil,

                "lock.lockedBy":
                    workerId,

                lastExecutionStatus:
                    "running",

                lastRunAt:
                    now,

                updatedAt:
                    now,
            },
        },
        {
            new: true,
        }
    );
};

/* ============================================================================
 * Release Execution Lock
 * ========================================================================== */

const releaseExecutionLock = async (
    scheduleId,
    tenantId,
    executionId
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    if (!validateObjectId(scheduleId)) {
        throw createServiceError(
            "Invalid schedule ID.",
            "REPORT_SCHEDULE_ID_INVALID",
            400
        );
    }

    return ReportSchedule.findOneAndUpdate(
        {
            _id: scheduleId,
            tenantId: normalizedTenant,
            "lock.executionId":
                executionId,
        },
        {
            $set: {
                "lock.executionId": null,
                "lock.lockedAt": null,
                "lock.lockedUntil": null,
                "lock.lockedBy": null,
                updatedAt: new Date(),
            },
        },
        {
            new: true,
        }
    );
};

/* ============================================================================
 * Execution ID
 * ========================================================================== */

const createExecutionId = (
    scheduleId
) => {
    return [
        "report",
        String(scheduleId),
        Date.now(),
        Math.random()
            .toString(36)
            .slice(2, 10),
    ].join("-");
};

/* ============================================================================
 * Trim History
 * ========================================================================== */

const trimExecutionHistory = (
    history
) => {
    if (!Array.isArray(history)) {
        return [];
    }

    if (
        history.length <=
        MAX_HISTORY_ENTRIES
    ) {
        return history;
    }

    return history.slice(
        -MAX_HISTORY_ENTRIES
    );
};

/* ============================================================================
 * Add Execution History
 * ========================================================================== */

const addExecutionHistory = async (
    scheduleId,
    tenantId,
    execution
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    const schedule =
        await getSchedule(
            scheduleId,
            normalizedTenant
        );

    schedule.executionHistory =
        trimExecutionHistory([
            ...(schedule.executionHistory || []),
            execution,
        ]);

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return schedule;
};

/* ============================================================================
 * Record Success
 * ========================================================================== */

const recordExecutionSuccess = async (
    scheduleId,
    tenantId,
    execution
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    const schedule =
        await getSchedule(
            scheduleId,
            normalizedTenant
        );

    const completedAt =
        execution.completedAt
            ? new Date(
                execution.completedAt
            )
            : new Date();

    const startedAt =
        execution.startedAt
            ? new Date(
                execution.startedAt
            )
            : schedule.lastRunAt ||
              completedAt;

    const durationMs =
        Math.max(
            0,
            completedAt.getTime() -
            new Date(startedAt).getTime()
        );

    schedule.totalRuns =
        Number(
            schedule.totalRuns || 0
        ) + 1;

    schedule.successfulRuns =
        Number(
            schedule.successfulRuns || 0
        ) + 1;

    schedule.consecutiveFailures = 0;

    schedule.lastRunAt =
        completedAt;

    schedule.lastSuccessAt =
        completedAt;

    schedule.lastFailureAt = null;

    schedule.lastExecutionStatus =
        "success";

    schedule.executionHistory =
        trimExecutionHistory([
            ...(schedule.executionHistory || []),
            {
                executionId:
                    execution.executionId ||
                    createExecutionId(
                        scheduleId
                    ),

                startedAt,
                completedAt,

                status: "success",

                format:
                    execution.format ||
                    schedule.format,

                filename:
                    execution.filename ||
                    null,

                size:
                    Number(
                        execution.size || 0
                    ),

                durationMs,

                errorCode: null,
                errorMessage: null,

                retryCount:
                    Number(
                        execution.retryCount || 0
                    ),

                requestId:
                    execution.requestId ||
                    null,
            },
        ]);

    if (
        schedule.enabled &&
        schedule.status === "active"
    ) {
        schedule.nextRunAt =
            calculateNextRun(
                schedule,
                completedAt
            );
    } else {
        schedule.nextRunAt = null;
    }

    schedule.lock = {
        executionId: null,
        lockedAt: null,
        lockedUntil: null,
        lockedBy: null,
    };

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Scheduled report execution recorded successfully.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Record Failure
 * ========================================================================== */

const recordExecutionFailure = async (
    scheduleId,
    tenantId,
    execution
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    const schedule =
        await getSchedule(
            scheduleId,
            normalizedTenant
        );

    const completedAt =
        execution.completedAt
            ? new Date(
                execution.completedAt
            )
            : new Date();

    const startedAt =
        execution.startedAt
            ? new Date(
                execution.startedAt
            )
            : schedule.lastRunAt ||
              completedAt;

    const durationMs =
        Math.max(
            0,
            completedAt.getTime() -
            new Date(startedAt).getTime()
        );

    schedule.totalRuns =
        Number(
            schedule.totalRuns || 0
        ) + 1;

    schedule.failedRuns =
        Number(
            schedule.failedRuns || 0
        ) + 1;

    schedule.consecutiveFailures =
        Number(
            schedule.consecutiveFailures || 0
        ) + 1;

    schedule.lastRunAt =
        completedAt;

    schedule.lastFailureAt =
        completedAt;

    schedule.lastExecutionStatus =
        "failed";

    schedule.executionHistory =
        trimExecutionHistory([
            ...(schedule.executionHistory || []),
            {
                executionId:
                    execution.executionId ||
                    createExecutionId(
                        scheduleId
                    ),

                startedAt,
                completedAt,

                status: "failed",

                format:
                    execution.format ||
                    schedule.format,

                filename: null,
                size: 0,

                durationMs,

                errorCode:
                    normalizeString(
                        execution.errorCode
                    ) ||
                    "REPORT_EXECUTION_FAILED",

                errorMessage:
                    normalizeString(
                        execution.errorMessage
                    ) ||
                    "Scheduled report execution failed.",

                retryCount:
                    Number(
                        execution.retryCount || 0
                    ),

                requestId:
                    execution.requestId ||
                    null,
            },
        ]);

    if (
        schedule.enabled &&
        schedule.status === "active"
    ) {
        schedule.nextRunAt =
            calculateNextRun(
                schedule,
                completedAt
            );
    } else {
        schedule.nextRunAt = null;
    }

    schedule.lock = {
        executionId: null,
        lockedAt: null,
        lockedUntil: null,
        lockedBy: null,
    };

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Scheduled report execution failure recorded.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Record Skipped
 * ========================================================================== */

const recordExecutionSkipped = async (
    scheduleId,
    tenantId,
    execution = {}
) => {
    const normalizedTenant =
        requireTenant(
            tenantId
        );

    const schedule =
        await getSchedule(
            scheduleId,
            normalizedTenant
        );

    const now = new Date();

    schedule.lastExecutionStatus =
        "skipped";

    schedule.executionHistory =
        trimExecutionHistory([
            ...(schedule.executionHistory || []),
            {
                executionId:
                    execution.executionId ||
                    createExecutionId(
                        scheduleId
                    ),

                startedAt:
                    execution.startedAt ||
                    now,

                completedAt:
                    execution.completedAt ||
                    now,

                status: "skipped",

                format:
                    execution.format ||
                    schedule.format,

                filename: null,
                size: 0,
                durationMs: 0,

                errorCode:
                    execution.errorCode ||
                    null,

                errorMessage:
                    execution.errorMessage ||
                    null,

                retryCount:
                    Number(
                        execution.retryCount || 0
                    ),

                requestId:
                    execution.requestId ||
                    null,
            },
        ]);

    if (
        schedule.enabled &&
        schedule.status === "active"
    ) {
        schedule.nextRunAt =
            calculateNextRun(
                schedule,
                now
            );
    }

    schedule.lock = {
        executionId: null,
        lockedAt: null,
        lockedUntil: null,
        lockedBy: null,
    };

    schedule.updatedAt = now;

    await schedule.save();

    return {
        success: true,
        message:
            "Scheduled report execution skipped.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Execute Scheduled Report
 * ========================================================================== */

const executeScheduledReport = async (
    schedule,
    options = {}
) => {
    if (!schedule) {
        throw createServiceError(
            "Schedule is required.",
            "REPORT_SCHEDULE_REQUIRED",
            400
        );
    }

    const scheduleId =
        schedule._id ||
        schedule.id;

    const tenantId =
        requireTenant(
            schedule.tenantId
        );

    if (!scheduleId) {
        throw createServiceError(
            "Schedule ID is required.",
            "REPORT_SCHEDULE_ID_REQUIRED",
            400
        );
    }

    const executionId =
        options.executionId ||
        createExecutionId(
            scheduleId
        );

    const startedAt =
        new Date();

    const lockedSchedule =
        await acquireExecutionLock(
            scheduleId,
            {
                tenantId,
                executionId,
                workerId:
                    options.workerId ||
                    "report-scheduler",
            }
        );

    if (!lockedSchedule) {
        return {
            success: false,
            skipped: true,

            message:
                "Schedule is already locked or is no longer due.",

            code:
                "REPORT_SCHEDULE_ALREADY_LOCKED",

            data: null,
            error: null,
        };
    }

    if (
        !reportService ||
        typeof reportService.generateScheduledReport !==
            "function"
    ) {
        await recordExecutionFailure(
            scheduleId,
            tenantId,
            {
                executionId,
                startedAt,
                completedAt: new Date(),

                errorCode:
                    "REPORT_SERVICE_UNAVAILABLE",

                errorMessage:
                    "reportService.generateScheduledReport() is unavailable.",

                requestId:
                    options.requestId ||
                    executionId,

                retryCount:
                    Number(
                        options.retryCount || 0
                    ),
            }
        );

        return {
            success: false,
            message:
                "reportService.generateScheduledReport() is unavailable.",
            data: null,

            error:
                createServiceError(
                    "reportService.generateScheduledReport() is unavailable.",
                    "REPORT_SERVICE_UNAVAILABLE",
                    503
                ),

            status: 503,
        };
    }

    try {
        const executionContext = {
            userId:
                lockedSchedule.createdBy ||
                options.userId ||
                null,

            user:
                options.user ||
                null,

            requestId:
                options.requestId ||
                executionId,

            executionDate:
                options.executionDate ||
                new Date(),
        };

        const result =
            await reportService.generateScheduledReport(
                lockedSchedule,
                executionContext
            );

        const completedAt =
            new Date();

        if (
            !result ||
            result.success === false
        ) {
            await recordExecutionFailure(
                scheduleId,
                tenantId,
                {
                    executionId,
                    startedAt,
                    completedAt,

                    errorCode:
                        result?.error?.code ||
                        result?.code ||
                        "REPORT_GENERATION_FAILED",

                    errorMessage:
                        result?.message ||
                        "Scheduled report generation failed.",

                    requestId:
                        options.requestId ||
                        executionId,

                    retryCount:
                        Number(
                            options.retryCount || 0
                        ),
                }
            );

            return {
                success: false,

                message:
                    result?.message ||
                    "Scheduled report generation failed.",

                data:
                    result?.data ||
                    null,

                error:
                    result?.error ||
                    null,

                status:
                    result?.status ||
                    500,
            };
        }

        const file =
            result.data || {};

        await recordExecutionSuccess(
            scheduleId,
            tenantId,
            {
                executionId,
                startedAt,
                completedAt,

                format:
                    file.format ||
                    lockedSchedule.format,

                filename:
                    file.filename ||
                    file.fileName ||
                    null,

                size:
                    Number(
                        file.size ||
                        file.fileSize ||
                        0
                    ),

                requestId:
                    options.requestId ||
                    executionId,

                retryCount:
                    Number(
                        options.retryCount || 0
                    ),
            }
        );

        return {
            success: true,

            message:
                "Scheduled report executed successfully.",

            data: {
                scheduleId,
                executionId,
                report: result.data,
                completedAt,
            },

            error: null,
        };
    } catch (error) {
        await recordExecutionFailure(
            scheduleId,
            tenantId,
            {
                executionId,
                startedAt,
                completedAt: new Date(),

                errorCode:
                    error.code ||
                    "REPORT_SCHEDULE_EXECUTION_FAILED",

                errorMessage:
                    error.message ||
                    "Scheduled report execution failed.",

                requestId:
                    options.requestId ||
                    executionId,

                retryCount:
                    Number(
                        options.retryCount || 0
                    ),
            }
        );

        return {
            success: false,

            message:
                error.message ||
                "Scheduled report execution failed.",

            data: null,
            error,

            status:
                error.status ||
                500,
        };
    }
};

/* ============================================================================
 * Retry Scheduled Report
 * ========================================================================== */

const retryScheduledReport = async (
    scheduleId,
    tenantId,
    options = {}
) => {
    const schedule =
        await getSchedule(
            scheduleId,
            tenantId
        );

    if (
        !schedule.enabled ||
        schedule.status !== "active"
    ) {
        throw createServiceError(
            "Cannot retry an inactive report schedule.",
            "REPORT_SCHEDULE_RETRY_NOT_ALLOWED",
            400
        );
    }

    const retryCount =
        Number(
            options.retryCount || 1
        );

    return executeScheduledReport(
        schedule,
        {
            ...options,
            retryCount,
        }
    );
};

/* ============================================================================
 * Reset Failure State
 * ========================================================================== */

const resetFailureState = async (
    scheduleId,
    tenantId,
    updatedBy = null
) => {
    const schedule =
        await getSchedule(
            scheduleId,
            tenantId
        );

    schedule.consecutiveFailures = 0;

    if (
        schedule.status === "failed"
    ) {
        schedule.status = "active";
        schedule.enabled = true;
    }

    schedule.nextRunAt =
        schedule.enabled &&
        schedule.status === "active"
            ? calculateNextRun(
                schedule,
                new Date()
            )
            : null;

    schedule.updatedBy =
        updatedBy ||
        schedule.updatedBy ||
        null;

    schedule.updatedAt =
        new Date();

    await schedule.save();

    return {
        success: true,
        message:
            "Schedule failure state reset successfully.",
        data: schedule,
        error: null,
    };
};

/* ============================================================================
 * Recover Expired Locks
 * ========================================================================== */

const recoverExpiredLocks = async (
    options = {}
) => {
    const now = new Date();

    const filter = {
        "lock.lockedUntil": {
            $lte: now,
        },
    };

    if (options.tenantId) {
        filter.tenantId =
            requireTenant(
                options.tenantId
            );
    }

    const result =
        await ReportSchedule.updateMany(
            filter,
            {
                $set: {
                    "lock.executionId": null,
                    "lock.lockedAt": null,
                    "lock.lockedUntil": null,
                    "lock.lockedBy": null,
                    updatedAt: now,
                },
            }
        );

    return {
        success: true,

        message:
            "Expired report schedule locks recovered successfully.",

        data: {
            matched:
                result.matchedCount ||
                0,

            modified:
                result.modifiedCount ||
                0,
        },

        error: null,
    };
};

/* ============================================================================
 * Recalculate All Next Runs
 * ========================================================================== */

const recalculateNextRuns = async (
    options = {}
) => {
    const filter = {
        enabled: true,
        status: "active",
    };

    if (options.tenantId) {
        filter.tenantId =
            requireTenant(
                options.tenantId
            );
    }

    const schedules =
        await ReportSchedule.find(
            filter
        );

    let updated = 0;

    for (const schedule of schedules) {
        try {
            schedule.nextRunAt =
                calculateNextRun(
                    schedule,
                    new Date()
                );

            schedule.updatedAt =
                new Date();

            await schedule.save();

            updated += 1;
        } catch (error) {
            console.error(
                `[${MODULE_NAME}] Failed to recalculate schedule ${schedule._id}:`,
                error.message
            );
        }
    }

    return {
        success: true,

        message:
            "Report schedule next-run values recalculated.",

        data: {
            total:
                schedules.length,

            updated,
        },

        error: null,
    };
};

/* ============================================================================
 * Schedule Metadata
 * ========================================================================== */

const getScheduleMeta = async () => {
    return {
        success: true,

        message:
            "Report scheduling metadata loaded successfully.",

        data: {
            module:
                MODULE_NAME,

            version:
                API_VERSION,

            scheduleTypes: [
                "daily",
                "weekly",
                "monthly",
                "custom",
            ],

            reportTypes:
                REPORT_TYPES,

            reportFormats:
                REPORT_FORMATS,

            reportPeriods:
                REPORT_PERIODS,

            lockDurationMs:
                LOCK_DURATION_MS,

            maxHistoryEntries:
                MAX_HISTORY_ENTRIES,
        },

        error: null,
    };
};

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    createSchedule,

    getSchedule,

    listSchedules,

    updateSchedule,

    deleteSchedule,

    pauseSchedule,

    resumeSchedule,

    disableSchedule,

    enableSchedule,

    calculateNextRun,

    refreshNextRun,

    findDueSchedules,

    acquireExecutionLock,

    releaseExecutionLock,

    createExecutionId,

    addExecutionHistory,

    recordExecutionSuccess,

    recordExecutionFailure,

    recordExecutionSkipped,

    executeScheduledReport,

    retryScheduledReport,

    resetFailureState,

    recoverExpiredLocks,

    recalculateNextRuns,

    normalizeScheduleInput,

    normalizeFilters,

    validateReportDefinition,

    validateFormat,

    validatePeriod,

    validateScheduleType,

    getScheduleMeta,
};

/**
 * ============================================================================
 * End reportScheduleService.js
 * ============================================================================
 */
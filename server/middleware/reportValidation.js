/**
 * ============================================================================
 * reportValidation.js
 * Phase 10.4 — Enterprise Report Validation Middleware
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - Validate report type
 * - Validate report name
 * - Validate report format
 * - Validate report period
 * - Validate dates
 * - Validate custom date ranges
 * - Validate tenant-aware report requests
 * - Validate report filters
 * - Prevent unexpected query/body values
 * - Normalize report request input
 * - Protect report endpoints before controller execution
 *
 * ============================================================================
 */

"use strict";

const {
    REPORT_TYPES,
    REPORT_FORMATS,
    ANALYTICS_REPORTS,
    TEAM_REPORTS,
    EMAIL_REPORTS,
    EXECUTIVE_REPORTS,
    REPORT_PERIODS,
    REPORT_LIMITS,
} = require("../utils/reportConstants");

/* ============================================================================
 * Validation Error Helper
 * ========================================================================== */

const validationError = (
    res,
    message,
    code = "REPORT_VALIDATION_ERROR",
    details = null
) => {
    return res.status(400).json({
        success: false,

        message,

        code,

        data: null,

        details,

        meta: {
            module:
                "ReportValidation",

            version:
                "1.0.0",

            timestamp:
                new Date().toISOString(),
        },
    });
};

/* ============================================================================
 * String Normalizer
 * ========================================================================== */

const normalizeString = (
    value,
    fallback = ""
) => {
    if (
        typeof value !== "string"
    ) {
        return fallback;
    }

    return value.trim();
};

/* ============================================================================
 * Lowercase Normalizer
 * ========================================================================== */

const normalizeLower = (
    value,
    fallback = ""
) => {
    return normalizeString(
        value,
        fallback
    ).toLowerCase();
};

/* ============================================================================
 * Source Builder
 *
 * Body has priority when explicitly supplied.
 * Query remains supported for GET endpoints.
 * ========================================================================== */

const getRequestSource = (
    req
) => {
    return {
        ...(req?.query || {}),
        ...(req?.body || {}),
    };
};

/* ============================================================================
 * Report Type Validation
 * ========================================================================== */

const validateReportType = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const reportType =
        normalizeLower(
            source.reportType ||
            source.type
        );

    if (!reportType) {
        return validationError(
            res,
            "Report type is required.",
            "REPORT_TYPE_REQUIRED"
        );
    }

    if (
        !Object.values(
            REPORT_TYPES
        ).includes(
            reportType
        )
    ) {
        return validationError(
            res,
            `Unsupported report type: ${reportType}`,
            "REPORT_TYPE_INVALID"
        );
    }

    req.reportValidation = {
        ...(req.reportValidation || {}),

        reportType,
    };

    return next();
};

/* ============================================================================
 * Report Name Validation
 * ========================================================================== */

const validateReportName = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const reportType =
        req.reportValidation?.reportType ||
        normalizeLower(
            source.reportType ||
            source.type
        );

    const report =
        normalizeLower(
            source.report
        );

    if (!report) {
        return next();
    }

    let allowedReports = [];

    switch (reportType) {
        case REPORT_TYPES.ANALYTICS:
            allowedReports =
                ANALYTICS_REPORTS;
            break;

        case REPORT_TYPES.TEAM:
            allowedReports =
                TEAM_REPORTS;
            break;

        case REPORT_TYPES.EMAIL:
            allowedReports =
                EMAIL_REPORTS;
            break;

        case REPORT_TYPES.EXECUTIVE:
            allowedReports =
                EXECUTIVE_REPORTS;
            break;

        default:
            allowedReports = [];
    }

    if (
        allowedReports.length > 0 &&
        !allowedReports.includes(
            report
        )
    ) {
        return validationError(
            res,
            `Unsupported report "${report}" for report type "${reportType}".`,
            "REPORT_NAME_INVALID"
        );
    }

    req.reportValidation = {
        ...(req.reportValidation || {}),

        report,
    };

    return next();
};

/* ============================================================================
 * Format Validation
 * ========================================================================== */

const validateReportFormat = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const format =
        normalizeLower(
            source.format,
            REPORT_FORMATS.PDF
        );

    if (
        !Object.values(
            REPORT_FORMATS
        ).includes(
            format
        )
    ) {
        return validationError(
            res,
            `Unsupported report format: ${format}`,
            "REPORT_FORMAT_INVALID"
        );
    }

    req.reportValidation = {
        ...(req.reportValidation || {}),

        format,
    };

    return next();
};

/* ============================================================================
 * Period Validation
 * ========================================================================== */

const validateReportPeriod = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const period =
        normalizeLower(
            source.period,
            "month"
        );

    if (
        !REPORT_PERIODS.includes(
            period
        )
    ) {
        return validationError(
            res,
            `Unsupported report period: ${period}`,
            "REPORT_PERIOD_INVALID"
        );
    }

    req.reportValidation = {
        ...(req.reportValidation || {}),

        period,
    };

    return next();
};

/* ============================================================================
 * Date Parser
 * ========================================================================== */

const parseDate = (
    value
) => {
    if (!value) {
        return null;
    }

    if (
        typeof value !== "string"
    ) {
        return null;
    }

    const date =
        new Date(
            value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
};

/* ============================================================================
 * Date Validation
 * ========================================================================== */

const validateReportDates = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const period =
        req.reportValidation?.period ||
        normalizeLower(
            source.period,
            "month"
        );

    const startDate =
        parseDate(
            source.startDate
        );

    const endDate =
        parseDate(
            source.endDate
        );

    if (
        source.startDate &&
        !startDate
    ) {
        return validationError(
            res,
            "Invalid startDate.",
            "REPORT_START_DATE_INVALID"
        );
    }

    if (
        source.endDate &&
        !endDate
    ) {
        return validationError(
            res,
            "Invalid endDate.",
            "REPORT_END_DATE_INVALID"
        );
    }

    if (
        period === "custom"
    ) {
        if (
            !startDate ||
            !endDate
        ) {
            return validationError(
                res,
                "startDate and endDate are required for a custom report period.",
                "REPORT_CUSTOM_DATE_REQUIRED"
            );
        }
    }

    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {
        return validationError(
            res,
            "startDate cannot be after endDate.",
            "REPORT_DATE_RANGE_INVALID"
        );
    }

    if (
        startDate &&
        endDate
    ) {
        const rangeMs =
            endDate.getTime() -
            startDate.getTime();

        const rangeDays =
            Math.ceil(
                rangeMs /
                (1000 * 60 * 60 * 24)
            );

        if (
            rangeDays >
            REPORT_LIMITS.MAX_DATE_RANGE_DAYS
        ) {
            return validationError(
                res,
                `Report date range cannot exceed ${REPORT_LIMITS.MAX_DATE_RANGE_DAYS} days.`,
                "REPORT_DATE_RANGE_TOO_LARGE"
            );
        }
    }

    req.reportValidation = {
        ...(req.reportValidation || {}),

        startDate:
            startDate || null,

        endDate:
            endDate || null,
    };

    return next();
};

/* ============================================================================
 * Identifier Validation
 * ========================================================================== */

const validateIdentifier = (
    value
) => {
    if (!value) {
        return true;
    }

    if (
        typeof value !== "string"
    ) {
        return false;
    }

    return /^[a-zA-Z0-9_-]{1,120}$/.test(
        value
    );
};

/* ============================================================================
 * Filter Validation
 * ========================================================================== */

const validateReportFilters = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const fields = [
        "teamId",
        "department",
        "month",
        "year",
        "priority",
        "category",
    ];

    for (
        const field of fields
    ) {
        const value =
            source[field];

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {
            continue;
        }

        if (
            typeof value !==
            "string"
        ) {
            return validationError(
                res,
                `${field} must be a string.`,
                "REPORT_FILTER_INVALID"
            );
        }

        if (
            value.length > 120
        ) {
            return validationError(
                res,
                `${field} exceeds the maximum allowed length.`,
                "REPORT_FILTER_TOO_LONG"
            );
        }
    }

    if (
        !validateIdentifier(
            source.teamId
        )
    ) {
        return validationError(
            res,
            "Invalid teamId.",
            "REPORT_TEAM_ID_INVALID"
        );
    }

    if (
        source.search &&
        typeof source.search !==
            "string"
    ) {
        return validationError(
            res,
            "search must be a string.",
            "REPORT_SEARCH_INVALID"
        );
    }

    if (
        source.search &&
        source.search.length > 200
    ) {
        return validationError(
            res,
            "search cannot exceed 200 characters.",
            "REPORT_SEARCH_TOO_LONG"
        );
    }

    return next();
};

/* ============================================================================
 * Tenant Validation
 *
 * Reports must never silently run without tenant context.
 * ========================================================================== */

const validateReportTenant = (
    req,
    res,
    next
) => {
    const tenantId =
        req?.user?.tenantId ||
        req?.auth?.tenantId ||
        req?.tenantId ||
        null;

    if (!tenantId) {
        return res.status(401).json({
            success: false,

            message:
                "Tenant context is required for enterprise reports.",

            code:
                "REPORT_TENANT_REQUIRED",

            data: null,

            meta: {
                module:
                    "ReportValidation",

                version:
                    "1.0.0",

                timestamp:
                    new Date().toISOString(),
            },
        });
    }

    req.reportContext = {
        ...(req.reportContext || {}),

        tenantId,
    };

    return next();
};

/* ============================================================================
 * Request Normalization
 * ========================================================================== */

const normalizeReportRequest = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const normalized = {
        reportType:
            normalizeLower(
                source.reportType ||
                source.type
            ),

        report:
            normalizeLower(
                source.report
            ) || null,

        format:
            normalizeLower(
                source.format,
                REPORT_FORMATS.PDF
            ),

        period:
            normalizeLower(
                source.period,
                "month"
            ),

        startDate:
            normalizeString(
                source.startDate
            ) || null,

        endDate:
            normalizeString(
                source.endDate
            ) || null,

        month:
            normalizeString(
                source.month
            ) || null,

        year:
            normalizeString(
                source.year
            ) || null,

        search:
            normalizeString(
                source.search
            ) || null,

        teamId:
            normalizeString(
                source.teamId
            ) || null,

        department:
            normalizeString(
                source.department
            ) || null,

        priority:
            normalizeString(
                source.priority
            ) || null,

        category:
            normalizeString(
                source.category
            ) || null,
    };

    req.reportRequest =
        normalized;

    return next();
};

/* ============================================================================
 * Full Validation Middleware
 *
 * Use this on report routes.
 * ========================================================================== */

const validateReportRequest = (
    req,
    res,
    next
) => {
    const source =
        getRequestSource(req);

    const reportType =
        normalizeLower(
            source.reportType ||
            source.type
        );

    const report =
        normalizeLower(
            source.report
        );

    const format =
        normalizeLower(
            source.format,
            REPORT_FORMATS.PDF
        );

    const period =
        normalizeLower(
            source.period,
            "month"
        );

    /* ------------------------------------------------------------------------
     * Report Type
     * ---------------------------------------------------------------------- */

    if (!reportType) {
        return validationError(
            res,
            "Report type is required.",
            "REPORT_TYPE_REQUIRED"
        );
    }

    if (
        !Object.values(
            REPORT_TYPES
        ).includes(
            reportType
        )
    ) {
        return validationError(
            res,
            `Unsupported report type: ${reportType}`,
            "REPORT_TYPE_INVALID"
        );
    }

    /* ------------------------------------------------------------------------
     * Report Name
     * ---------------------------------------------------------------------- */

    let allowedReports = [];

    switch (reportType) {
        case REPORT_TYPES.ANALYTICS:
            allowedReports =
                ANALYTICS_REPORTS;
            break;

        case REPORT_TYPES.TEAM:
            allowedReports =
                TEAM_REPORTS;
            break;

        case REPORT_TYPES.EMAIL:
            allowedReports =
                EMAIL_REPORTS;
            break;

        case REPORT_TYPES.EXECUTIVE:
            allowedReports =
                EXECUTIVE_REPORTS;
            break;

        default:
            allowedReports = [];
    }

    if (
        report &&
        allowedReports.length > 0 &&
        !allowedReports.includes(
            report
        )
    ) {
        return validationError(
            res,
            `Unsupported report "${report}" for "${reportType}".`,
            "REPORT_NAME_INVALID"
        );
    }

    /* ------------------------------------------------------------------------
     * Format
     * ---------------------------------------------------------------------- */

    if (
        !Object.values(
            REPORT_FORMATS
        ).includes(
            format
        )
    ) {
        return validationError(
            res,
            `Unsupported report format: ${format}`,
            "REPORT_FORMAT_INVALID"
        );
    }

    /* ------------------------------------------------------------------------
     * Period
     * ---------------------------------------------------------------------- */

    if (
        !REPORT_PERIODS.includes(
            period
        )
    ) {
        return validationError(
            res,
            `Unsupported report period: ${period}`,
            "REPORT_PERIOD_INVALID"
        );
    }

    /* ------------------------------------------------------------------------
     * Dates
     * ---------------------------------------------------------------------- */

    const startDate =
        parseDate(
            source.startDate
        );

    const endDate =
        parseDate(
            source.endDate
        );

    if (
        source.startDate &&
        !startDate
    ) {
        return validationError(
            res,
            "Invalid startDate.",
            "REPORT_START_DATE_INVALID"
        );
    }

    if (
        source.endDate &&
        !endDate
    ) {
        return validationError(
            res,
            "Invalid endDate.",
            "REPORT_END_DATE_INVALID"
        );
    }

    if (
        period === "custom" &&
        (!startDate || !endDate)
    ) {
        return validationError(
            res,
            "startDate and endDate are required for custom reports.",
            "REPORT_CUSTOM_DATE_REQUIRED"
        );
    }

    if (
        startDate &&
        endDate &&
        startDate > endDate
    ) {
        return validationError(
            res,
            "startDate cannot be after endDate.",
            "REPORT_DATE_RANGE_INVALID"
        );
    }

    if (
        startDate &&
        endDate
    ) {
        const rangeDays =
            Math.ceil(
                (
                    endDate.getTime() -
                    startDate.getTime()
                ) /
                (1000 * 60 * 60 * 24)
            );

        if (
            rangeDays >
            REPORT_LIMITS.MAX_DATE_RANGE_DAYS
        ) {
            return validationError(
                res,
                `Report date range cannot exceed ${REPORT_LIMITS.MAX_DATE_RANGE_DAYS} days.`,
                "REPORT_DATE_RANGE_TOO_LARGE"
            );
        }
    }

    /* ------------------------------------------------------------------------
     * Search
     * ---------------------------------------------------------------------- */

    if (
        source.search &&
        typeof source.search !==
            "string"
    ) {
        return validationError(
            res,
            "search must be a string.",
            "REPORT_SEARCH_INVALID"
        );
    }

    if (
        source.search &&
        source.search.length > 200
    ) {
        return validationError(
            res,
            "search cannot exceed 200 characters.",
            "REPORT_SEARCH_TOO_LONG"
        );
    }

    /* ------------------------------------------------------------------------
     * Team ID
     * ---------------------------------------------------------------------- */

    if (
        !validateIdentifier(
            source.teamId
        )
    ) {
        return validationError(
            res,
            "Invalid teamId.",
            "REPORT_TEAM_ID_INVALID"
        );
    }

    /* ------------------------------------------------------------------------
     * Filter Lengths
     * ---------------------------------------------------------------------- */

    const filters = [
        "department",
        "month",
        "year",
        "priority",
        "category",
    ];

    for (
        const field of filters
    ) {
        if (
            source[field] &&
            typeof source[field] !==
                "string"
        ) {
            return validationError(
                res,
                `${field} must be a string.`,
                "REPORT_FILTER_INVALID"
            );
        }

        if (
            source[field] &&
            source[field].length > 120
        ) {
            return validationError(
                res,
                `${field} exceeds the maximum allowed length.`,
                "REPORT_FILTER_TOO_LONG"
            );
        }
    }

    /* ------------------------------------------------------------------------
     * Save Validated Request
     * ---------------------------------------------------------------------- */

    req.reportRequest = {
        reportType,

        report:
            report || null,

        format,

        period,

        startDate:
            source.startDate ||
            null,

        endDate:
            source.endDate ||
            null,

        month:
            normalizeString(
                source.month
            ) || null,

        year:
            normalizeString(
                source.year
            ) || null,

        search:
            normalizeString(
                source.search
            ) || null,

        teamId:
            normalizeString(
                source.teamId
            ) || null,

        department:
            normalizeString(
                source.department
            ) || null,

        priority:
            normalizeString(
                source.priority
            ) || null,

        category:
            normalizeString(
                source.category
            ) || null,
    };

    req.reportValidation = {
        valid: true,

        reportType,

        report:
            report || null,

        format,

        period,

        startDate:
            startDate || null,

        endDate:
            endDate || null,
    };

    return next();
};

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    validateReportType,

    validateReportName,

    validateReportFormat,

    validateReportPeriod,

    validateReportDates,

    validateReportFilters,

    validateReportTenant,

    normalizeReportRequest,

    validateReportRequest,
};

/**
 * ============================================================================
 * End reportValidation.js
 * ============================================================================
 */
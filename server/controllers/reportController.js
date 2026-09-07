/**
 * ============================================================================
 * reportController.js
 * Phase 10.2 — Enterprise Report Controller
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - Report generation
 * - Analytics report handling
 * - Team report handling
 * - Email report handling
 * - Executive report handling
 * - PDF / XLSX / CSV downloads
 * - Request normalization
 * - Tenant-aware request context
 * - Consistent API responses
 * - Secure download headers
 * - Service-level error handling
 *
 * ============================================================================
 */

"use strict";

const reportService = require("../services/reportService");

const {
    REPORT_FORMATS,
    REPORT_PERIODS,
} = require("../utils/reportConstants");

/* ============================================================================
 * Constants
 * ========================================================================== */

const MODULE_NAME = "Report";
const API_VERSION = "1.0.0";

const DEFAULT_FORMAT = REPORT_FORMATS.PDF;
const DEFAULT_PERIOD = "month";

/* ============================================================================
 * Response Helpers
 * ========================================================================== */

const successResponse = (
    res,
    data = {},
    message = "Report generated successfully.",
    status = 200
) => {
    return res.status(status).json({
        success: true,
        message,
        data,
        meta: {
            module: MODULE_NAME,
            version: API_VERSION,
            timestamp: new Date().toISOString(),
        },
    });
};

const errorResponse = (
    res,
    error,
    status = 500,
    message = null
) => {
    console.error(
        `[${MODULE_NAME}Controller]`,
        error
    );

    return res.status(status).json({
        success: false,
        message:
            message ||
            error?.message ||
            "Unable to generate report.",
        code:
            error?.code ||
            "REPORT_REQUEST_ERROR",
        data: null,
        meta: {
            module: MODULE_NAME,
            version: API_VERSION,
            timestamp: new Date().toISOString(),
        },
    });
};

/* ============================================================================
 * Request Helpers
 * ========================================================================== */

const normalizeString = (
    value,
    fallback = ""
) => {
    if (typeof value !== "string") {
        return fallback;
    }

    return value.trim();
};

const normalizeFormat = (
    value
) => {
    const format =
        normalizeString(
            value,
            DEFAULT_FORMAT
        ).toLowerCase();

    return Object.values(
        REPORT_FORMATS
    ).includes(format)
        ? format
        : DEFAULT_FORMAT;
};

const normalizePeriod = (
    value
) => {
    const period =
        normalizeString(
            value,
            DEFAULT_PERIOD
        ).toLowerCase();

    return REPORT_PERIODS.includes(
        period
    )
        ? period
        : DEFAULT_PERIOD;
};

/* ============================================================================
 * Tenant Context
 * ========================================================================== */

const getTenantId = (
    req
) => {
    return (
        req?.user?.tenantId ||
        req?.auth?.tenantId ||
        req?.tenantId ||
        null
    );
};

/* ============================================================================
 * User Context
 * ========================================================================== */

const getUserId = (
    req
) => {
    return (
        req?.user?._id ||
        req?.user?.id ||
        req?.auth?.userId ||
        null
    );
};

/* ============================================================================
 * Build Report Context
 * ========================================================================== */

const buildReportContext = (
    req
) => {
    return {
        tenantId:
            getTenantId(req),

        userId:
            getUserId(req),

        user:
            req?.user || null,

        requestId:
            req?.requestId ||
            null,

        ip:
            req?.ip ||
            null,
    };
};

/* ============================================================================
 * Build Report Options
 * ========================================================================== */

const buildReportOptions = (
    req
) => {
    const source = {
        ...(req?.query || {}),
        ...(req?.body || {}),
    };

    const options = {
        reportType:
            normalizeString(
                source.reportType ||
                source.type
            ),

        report:
            normalizeString(
                source.report
            ),

        format:
            normalizeFormat(
                source.format
            ),

        period:
            normalizePeriod(
                source.period
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

    return options;
};

/* ============================================================================
 * Generate Report
 * ========================================================================== */

/**
 * POST /api/reports
 *
 * Generates a report based on requested type and format.
 */
const generateReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        const context =
            buildReportContext(req);

        const result =
            await reportService.generateReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            result?.message ||
                "Report generated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Get Report Preview
 * ========================================================================== */

/**
 * GET /api/reports/preview
 *
 * Returns report data without forcing a file download.
 */
const previewReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        const context =
            buildReportContext(req);

        const result =
            await reportService.previewReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            result?.message ||
                "Report preview generated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Download Report
 * ========================================================================== */

/**
 * GET /api/reports/download
 *
 * Generates and downloads PDF/XLSX/CSV.
 */
const downloadReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        const context =
            buildReportContext(req);

        const result =
            await reportService.downloadReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        const file =
            result?.data ||
            result;

        if (!file) {
            return errorResponse(
                res,
                null,
                404,
                "Report file could not be generated."
            );
        }

        const buffer =
            file.buffer ||
            file.data ||
            null;

        if (!buffer) {
            return errorResponse(
                res,
                null,
                500,
                "Generated report contains no file data."
            );
        }

        const format =
            normalizeFormat(
                file.format ||
                options.format
            );

        const contentType =
            getContentType(format);

        const filename =
            sanitizeFilename(
                file.filename ||
                buildFilename(
                    options
                )
            );

        res.setHeader(
            "Content-Type",
            contentType
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        res.setHeader(
            "Content-Length",
            Buffer.byteLength(buffer)
        );

        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, private"
        );

        res.setHeader(
            "Pragma",
            "no-cache"
        );

        res.setHeader(
            "Expires",
            "0"
        );

        return res.status(200).send(
            buffer
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Analytics Report
 * ========================================================================== */

/**
 * GET /api/reports/analytics
 */
const getAnalyticsReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        options.reportType =
            "analytics";

        const context =
            buildReportContext(req);

        const result =
            await reportService.generateAnalyticsReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            result?.message ||
                "Analytics report generated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Team Report
 * ========================================================================== */

/**
 * GET /api/reports/team
 */
const getTeamReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        options.reportType =
            "team";

        const context =
            buildReportContext(req);

        const result =
            await reportService.generateTeamReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            result?.message ||
                "Team report generated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Email Report
 * ========================================================================== */

/**
 * GET /api/reports/email
 */
const getEmailReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        options.reportType =
            "email";

        const context =
            buildReportContext(req);

        const result =
            await reportService.generateEmailReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            result?.message ||
                "Email report generated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Executive Report
 * ========================================================================== */

/**
 * GET /api/reports/executive
 */
const getExecutiveReport = async (
    req,
    res
) => {
    try {
        const options =
            buildReportOptions(req);

        options.reportType =
            "executive";

        const context =
            buildReportContext(req);

        const result =
            await reportService.generateExecutiveReport(
                options,
                context
            );

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            result?.message ||
                "Executive report generated successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Report Metadata
 * ========================================================================== */

/**
 * GET /api/reports/meta
 */
const getReportMeta = async (
    req,
    res
) => {
    try {
        const result =
            await reportService.getReportMeta();

        if (
            result?.success === false
        ) {
            return errorResponse(
                res,
                result?.error || result,
                result?.status || 400,
                result?.message
            );
        }

        return successResponse(
            res,
            result?.data || result,
            "Report metadata loaded successfully."
        );
    } catch (error) {
        return errorResponse(
            res,
            error
        );
    }
};

/* ============================================================================
 * Content Type
 * ========================================================================== */

const getContentType = (
    format
) => {
    switch (format) {
        case REPORT_FORMATS.PDF:
            return "application/pdf";

        case REPORT_FORMATS.XLSX:
            return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

        case REPORT_FORMATS.CSV:
            return "text/csv; charset=utf-8";

        default:
            return "application/octet-stream";
    }
};

/* ============================================================================
 * Filename Builder
 * ========================================================================== */

const buildFilename = (
    options
) => {
    const report =
        options.report ||
        options.reportType ||
        "report";

    const format =
        options.format ||
        DEFAULT_FORMAT;

    const timestamp =
        new Date()
            .toISOString()
            .replace(
                /[:.]/g,
                "-"
            );

    return `microsoft365-${report}-${timestamp}.${format}`;
};

/* ============================================================================
 * Filename Sanitizer
 * ========================================================================== */

const sanitizeFilename = (
    filename
) => {
    return String(filename)
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )
        .slice(
            0,
            180
        );
};

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    generateReport,
    previewReport,
    downloadReport,

    getAnalyticsReport,
    getTeamReport,
    getEmailReport,
    getExecutiveReport,

    getReportMeta,
};

/**
 * ============================================================================
 * End reportController.js
 * ============================================================================
 */
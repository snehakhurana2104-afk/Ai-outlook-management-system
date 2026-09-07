/**
 * ============================================================================
 * reportScheduleController.js
 * Phase 10.7.6 — Enterprise Report Schedule Controller
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 */

"use strict";

const ReportSchedule = require("../models/ReportSchedule");

const {
    runScheduleNow,
} = require("../jobs/reportScheduler");

/* ============================================================================
 * Helpers
 * ========================================================================== */

const successResponse = (
    res,
    data,
    message,
    status = 200
) => {
    return res.status(status).json({
        success: true,

        message,

        data,

        error: null,

        meta: {
            module:
                "ReportScheduleController",

            version:
                "1.0.0",

            timestamp:
                new Date().toISOString(),
        },
    });
};

const errorResponse = (
    res,
    message,
    code = "REPORT_SCHEDULE_ERROR",
    status = 400,
    details = null
) => {
    return res.status(status).json({
        success: false,

        message,

        code,

        data: null,

        details,

        meta: {
            module:
                "ReportScheduleController",

            version:
                "1.0.0",

            timestamp:
                new Date().toISOString(),
        },
    });
};

/* ============================================================================
 * Tenant Context
 * ========================================================================== */

const getTenantId = (req) => {
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

const getUserId = (req) => {
    return (
        req?.user?.id ||
        req?.user?._id ||
        req?.auth?.userId ||
        null
    );
};

/* ============================================================================
 * Create Schedule
 * ========================================================================== */

const createSchedule = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        const userId =
            getUserId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const body =
            req.body || {};

        if (!body.name) {
            return errorResponse(
                res,
                "Schedule name is required.",
                "REPORT_SCHEDULE_NAME_REQUIRED"
            );
        }

        if (!body.reportType) {
            return errorResponse(
                res,
                "Report type is required.",
                "REPORT_SCHEDULE_REPORT_TYPE_REQUIRED"
            );
        }

        const schedule =
            new ReportSchedule({
                tenantId,

                createdBy:
                    userId,

                updatedBy:
                    userId,

                name:
                    body.name,

                description:
                    body.description ||
                    "",

                reportType:
                    body.reportType,

                report:
                    body.report ||
                    null,

                format:
                    body.format ||
                    "pdf",

                period:
                    body.period ||
                    "month",

                filters:
                    body.filters ||
                    {},

                startDate:
                    body.startDate ||
                    null,

                endDate:
                    body.endDate ||
                    null,

                scheduleType:
                    body.scheduleType ||
                    "monthly",

                timezone:
                    body.timezone ||
                    "UTC",

                time:
                    body.time ||
                    "09:00",

                dayOfWeek:
                    body.dayOfWeek ??
                    null,

                dayOfMonth:
                    body.dayOfMonth ??
                    null,

                intervalMinutes:
                    body.intervalMinutes ??
                    null,

                customCron:
                    body.customCron ||
                    null,

                enabled:
                    body.enabled !==
                    false,

                status:
                    body.enabled === false
                        ? "disabled"
                        : "active",

                nextRunAt:
                    null,
            });

        await schedule.validate();

        const scheduler =
            require("../jobs/reportScheduler");

        schedule.nextRunAt =
            scheduler.calculateNextRun(
                schedule,
                new Date()
            );

        await schedule.save();

        return successResponse(
            res,
            schedule,
            "Report schedule created successfully.",
            201
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to create report schedule.",
            error.code ||
                "REPORT_SCHEDULE_CREATE_ERROR",
            error.status ||
                400
        );
    }
};

/* ============================================================================
 * List Schedules
 * ========================================================================== */

const listSchedules = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const {
            status,
            reportType,
            enabled,
        } = req.query || {};

        const filter = {
            tenantId,
        };

        if (status) {
            filter.status =
                status;
        }

        if (reportType) {
            filter.reportType =
                reportType;
        }

        if (
            enabled !== undefined
        ) {
            filter.enabled =
                enabled === "true";
        }

        const schedules =
            await ReportSchedule
                .find(filter)
                .sort({
                    nextRunAt: 1,
                    createdAt: -1,
                });

        return successResponse(
            res,
            schedules,
            "Report schedules loaded successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to load report schedules.",
            "REPORT_SCHEDULE_LIST_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Get Schedule
 * ========================================================================== */

const getSchedule = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOne({
                _id:
                    req.params.id,

                tenantId,
            });

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        return successResponse(
            res,
            schedule,
            "Report schedule loaded successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to load report schedule.",
            "REPORT_SCHEDULE_GET_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Update Schedule
 * ========================================================================== */

const updateSchedule = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        const userId =
            getUserId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOne({
                _id:
                    req.params.id,

                tenantId,
            });

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        const body =
            req.body || {};

        const allowedFields = [
            "name",
            "description",
            "reportType",
            "report",
            "format",
            "period",
            "filters",
            "startDate",
            "endDate",
            "scheduleType",
            "timezone",
            "time",
            "dayOfWeek",
            "dayOfMonth",
            "intervalMinutes",
            "customCron",
            "enabled",
        ];

        for (
            const field of allowedFields
        ) {
            if (
                body[field] !==
                undefined
            ) {
                schedule[field] =
                    body[field];
            }
        }

        schedule.updatedBy =
            userId;

        if (
            schedule.enabled === false
        ) {
            schedule.status =
                "disabled";
        } else if (
            schedule.status ===
            "disabled"
        ) {
            schedule.status =
                "active";
        }

        const scheduler =
            require("../jobs/reportScheduler");

        schedule.nextRunAt =
            schedule.enabled
                ? scheduler.calculateNextRun(
                      schedule,
                      new Date()
                  )
                : null;

        await schedule.validate();

        await schedule.save();

        return successResponse(
            res,
            schedule,
            "Report schedule updated successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to update report schedule.",
            error.code ||
                "REPORT_SCHEDULE_UPDATE_ERROR",
            error.status ||
                400
        );
    }
};

/* ============================================================================
 * Pause Schedule
 * ========================================================================== */

const pauseSchedule = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOne({
                _id:
                    req.params.id,

                tenantId,
            });

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        schedule.status =
            "paused";

        schedule.enabled =
            false;

        schedule.nextRunAt =
            null;

        schedule.updatedBy =
            getUserId(req);

        await schedule.save();

        return successResponse(
            res,
            schedule,
            "Report schedule paused successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to pause report schedule.",
            "REPORT_SCHEDULE_PAUSE_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Resume Schedule
 * ========================================================================== */

const resumeSchedule = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOne({
                _id:
                    req.params.id,

                tenantId,
            });

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        schedule.enabled =
            true;

        schedule.status =
            "active";

        schedule.updatedBy =
            getUserId(req);

        const scheduler =
            require("../jobs/reportScheduler");

        schedule.nextRunAt =
            scheduler.calculateNextRun(
                schedule,
                new Date()
            );

        await schedule.save();

        return successResponse(
            res,
            schedule,
            "Report schedule resumed successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to resume report schedule.",
            "REPORT_SCHEDULE_RESUME_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Run Now
 * ========================================================================== */

const executeNow = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOne({
                _id:
                    req.params.id,

                tenantId,
            });

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        const result =
            await runScheduleNow(
                schedule._id
            );

        if (
            result?.success === false &&
            !result?.skipped
        ) {
            return errorResponse(
                res,
                result.message ||
                    result.error ||
                    "Unable to execute scheduled report.",
                result.code ||
                    "REPORT_SCHEDULE_EXECUTION_ERROR",
                400
            );
        }

        return successResponse(
            res,
            result,
            "Scheduled report execution completed."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to execute scheduled report.",
            error.code ||
                "REPORT_SCHEDULE_EXECUTION_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Delete Schedule
 * ========================================================================== */

const deleteSchedule = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOneAndDelete({
                _id:
                    req.params.id,

                tenantId,
            });

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        return successResponse(
            res,
            {
                id:
                    schedule._id,
            },
            "Report schedule deleted successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to delete report schedule.",
            "REPORT_SCHEDULE_DELETE_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Execution History
 * ========================================================================== */

const getExecutionHistory = async (
    req,
    res
) => {
    try {
        const tenantId =
            getTenantId(req);

        if (!tenantId) {
            return errorResponse(
                res,
                "Tenant context is required.",
                "REPORT_SCHEDULE_TENANT_REQUIRED",
                401
            );
        }

        const schedule =
            await ReportSchedule.findOne({
                _id:
                    req.params.id,

                tenantId,
            }).select(
                "name executionHistory totalRuns successfulRuns failedRuns lastRunAt lastSuccessAt lastFailureAt"
            );

        if (!schedule) {
            return errorResponse(
                res,
                "Report schedule not found.",
                "REPORT_SCHEDULE_NOT_FOUND",
                404
            );
        }

        return successResponse(
            res,
            schedule,
            "Report execution history loaded successfully."
        );
    } catch (
        error
    ) {
        return errorResponse(
            res,
            error.message ||
                "Unable to load execution history.",
            "REPORT_SCHEDULE_HISTORY_ERROR",
            500
        );
    }
};

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    createSchedule,

    listSchedules,

    getSchedule,

    updateSchedule,

    pauseSchedule,

    resumeSchedule,

    executeNow,

    deleteSchedule,

    getExecutionHistory,
};
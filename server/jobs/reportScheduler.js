/**
 * ============================================================================
 * reportScheduler.js
 * Phase 10.7.8 — Enterprise Report Scheduler Final Hardening
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 *
 * - Find due schedules
 * - Tenant-aware execution
 * - Distributed locking
 * - Duplicate execution prevention
 * - Scheduled execution
 * - Manual execution
 * - Retry failed report generation
 * - Retry with exponential backoff
 * - Lock heartbeat
 * - Expired-lock recovery
 * - Execution history
 * - Failure statistics
 * - Successful execution statistics
 * - Automatic schedule disabling
 * - Graceful scheduler shutdown
 * - Scheduler health/status
 *
 * ============================================================================
 */

"use strict";

const crypto = require("crypto");

const ReportSchedule = require("../models/ReportSchedule");
const reportService = require("../services/reportService");

/* ============================================================================
 * Constants
 * ========================================================================== */

const MODULE_NAME = "ReportScheduler";

const DEFAULT_INTERVAL_MS =
    60 * 1000;

const DEFAULT_LOCK_MINUTES =
    30;

const DEFAULT_HEARTBEAT_MINUTES =
    5;

const MAX_HISTORY_ITEMS =
    50;

const MAX_CONSECUTIVE_FAILURES =
    5;

const MAX_SCHEDULE_BATCH =
    50;

const DEFAULT_RETRY_COUNT =
    3;

const DEFAULT_RETRY_DELAY_MS =
    5000;

const MAX_RETRY_DELAY_MS =
    60 * 1000;

/* ============================================================================
 * Runtime State
 * ========================================================================== */

let schedulerTimer = null;

let schedulerRunning = false;

let schedulerStopping = false;

/* ============================================================================
 * Logger
 * ========================================================================== */

const log = (...args) => {
    console.log(
        `[${MODULE_NAME}]`,
        ...args
    );
};

const logError = (...args) => {
    console.error(
        `[${MODULE_NAME}]`,
        ...args
    );
};

/* ============================================================================
 * Execution ID
 * ========================================================================== */

const createExecutionId = () => {
    try {
        if (
            typeof crypto.randomUUID ===
            "function"
        ) {
            return `report-${crypto.randomUUID()}`;
        }

        return (
            `report-${Date.now()}-` +
            crypto
                .randomBytes(8)
                .toString("hex")
        );
    } catch (error) {
        return (
            `report-${Date.now()}-` +
            Math.random()
                .toString(36)
                .slice(2)
        );
    }
};

/* ============================================================================
 * Scheduler ID
 * ========================================================================== */

const getSchedulerId = () => {
    return (
        process.env.REPORT_SCHEDULER_ID ||
        `scheduler-${process.pid}`
    );
};

/* ============================================================================
 * Date Helpers
 * ========================================================================== */

const addMinutes = (
    date,
    minutes
) => {
    const result =
        new Date(date);

    result.setMinutes(
        result.getMinutes() +
            Number(minutes || 0)
    );

    return result;
};

/* ============================================================================
 * Sleep
 * ========================================================================== */

const sleep = (
    milliseconds
) => {
    const delay =
        Math.max(
            0,
            Number(milliseconds) || 0
        );

    return new Promise(
        (resolve) => {
            setTimeout(
                resolve,
                delay
            );
        }
    );
};

/* ============================================================================
 * Retry Delay
 * ========================================================================== */

const calculateRetryDelay = (
    retryCount
) => {
    const count =
        Math.max(
            0,
            Number(retryCount) || 0
        );

    const delay =
        DEFAULT_RETRY_DELAY_MS *
        Math.pow(2, count);

    return Math.min(
        delay,
        MAX_RETRY_DELAY_MS
    );
};

/* ============================================================================
 * Schedule Time
 * ========================================================================== */

const getScheduleTime = (
    schedule
) => {
    const time =
        String(
            schedule?.time ||
                "09:00"
        ).trim();

    const parts =
        time.split(":");

    const hour =
        Number(parts[0]);

    const minute =
        Number(parts[1]);

    return {
        hour:
            Number.isInteger(hour) &&
            hour >= 0 &&
            hour <= 23
                ? hour
                : 9,

        minute:
            Number.isInteger(minute) &&
            minute >= 0 &&
            minute <= 59
                ? minute
                : 0,
    };
};

/* ============================================================================
 * Calculate Next Run
 * ========================================================================== */

const calculateNextRun = (
    schedule,
    fromDate = new Date()
) => {
    if (!schedule) {
        return null;
    }

    const current =
        new Date(fromDate);

    if (
        Number.isNaN(
            current.getTime()
        )
    ) {
        return null;
    }

    const {
        hour,
        minute,
    } =
        getScheduleTime(
            schedule
        );

    let next =
        new Date(current);

    next.setSeconds(
        0,
        0
    );

    switch (
        schedule.scheduleType
    ) {
        case "daily": {
            next.setHours(
                hour,
                minute,
                0,
                0
            );

            if (
                next <= current
            ) {
                next.setDate(
                    next.getDate() + 1
                );
            }

            return next;
        }

        case "weekly": {
            const targetDay =
                Number.isInteger(
                    Number(
                        schedule.dayOfWeek
                    )
                )
                    ? Number(
                          schedule.dayOfWeek
                      )
                    : 1;

            next.setHours(
                hour,
                minute,
                0,
                0
            );

            let daysUntil =
                targetDay -
                next.getDay();

            if (
                daysUntil < 0
            ) {
                daysUntil += 7;
            }

            if (
                daysUntil === 0 &&
                next <= current
            ) {
                daysUntil = 7;
            }

            next.setDate(
                next.getDate() +
                    daysUntil
            );

            return next;
        }

        case "monthly": {
            const targetDay =
                Number.isInteger(
                    Number(
                        schedule.dayOfMonth
                    )
                )
                    ? Number(
                          schedule.dayOfMonth
                      )
                    : 1;

            let year =
                current.getFullYear();

            let month =
                current.getMonth();

            const createMonthlyDate =
                (
                    targetYear,
                    targetMonth
                ) => {
                    const daysInMonth =
                        new Date(
                            targetYear,
                            targetMonth + 1,
                            0
                        ).getDate();

                    return new Date(
                        targetYear,
                        targetMonth,
                        Math.min(
                            targetDay,
                            daysInMonth
                        ),
                        hour,
                        minute,
                        0,
                        0
                    );
                };

            next =
                createMonthlyDate(
                    year,
                    month
                );

            if (
                next <= current
            ) {
                month += 1;

                if (
                    month > 11
                ) {
                    month = 0;
                    year += 1;
                }

                next =
                    createMonthlyDate(
                        year,
                        month
                    );
            }

            return next;
        }

        case "custom": {
            const intervalMinutes =
                Number(
                    schedule.intervalMinutes
                );

            if (
                Number.isFinite(
                    intervalMinutes
                ) &&
                intervalMinutes > 0
            ) {
                return addMinutes(
                    current,
                    intervalMinutes
                );
            }

            return null;
        }

        default:
            return null;
    }
};

/* ============================================================================
 * Tenant Validation
 * ========================================================================== */

const validateExecutionContext = (
    schedule,
    executionContext = {}
) => {
    if (!schedule) {
        const error =
            new Error(
                "Report schedule is required."
            );

        error.code =
            "REPORT_SCHEDULE_REQUIRED";

        throw error;
    }

    const scheduleTenantId =
        schedule.tenantId
            ? String(
                  schedule.tenantId
              )
            : null;

    const contextTenantId =
        executionContext.tenantId
            ? String(
                  executionContext.tenantId
              )
            : null;

    if (
        scheduleTenantId &&
        contextTenantId &&
        scheduleTenantId !==
            contextTenantId
    ) {
        const error =
            new Error(
                "Tenant mismatch for report schedule execution."
            );

        error.code =
            "REPORT_SCHEDULE_TENANT_MISMATCH";

        throw error;
    }

    return {
        ...executionContext,

        tenantId:
            scheduleTenantId ||
            contextTenantId ||
            null,

        userId:
            executionContext.userId ||
            schedule.createdBy ||
            null,
    };
};

/* ============================================================================
 * History Entry
 * ========================================================================== */

const createHistoryEntry = ({
    executionId,
    startedAt,
    completedAt,
    status,
    format,
    filename,
    size,
    durationMs,
    errorCode,
    errorMessage,
    retryCount,
    requestId,
}) => {
    return {
        executionId,

        startedAt,

        completedAt:
            completedAt || null,

        status:
            status || "failed",

        format:
            format || null,

        filename:
            filename || null,

        size:
            Number(size) || 0,

        durationMs:
            Number(durationMs) || 0,

        errorCode:
            errorCode || null,

        errorMessage:
            errorMessage || null,

        retryCount:
            Number(retryCount) || 0,

        requestId:
            requestId || null,
    };
};

/* ============================================================================
 * Recover Expired Locks
 * ========================================================================== */

const releaseExpiredLocks =
    async () => {
        const now =
            new Date();

        try {
            const result =
                await ReportSchedule.updateMany(
                    {
                        "lock.lockedUntil": {
                            $lt: now,
                        },
                    },
                    {
                        $set: {
                            "lock.executionId":
                                null,

                            "lock.lockedAt":
                                null,

                            "lock.lockedUntil":
                                null,

                            "lock.lockedBy":
                                null,

                            lastExecutionStatus:
                                "failed",
                        },
                    }
                );

            if (
                result &&
                result.modifiedCount > 0
            ) {
                log(
                    `Recovered ${result.modifiedCount} expired scheduler lock(s).`
                );
            }

            return result;
        } catch (error) {
            logError(
                "Expired lock recovery failed:",
                error.message
            );

            return null;
        }
    };

/* ============================================================================
 * Acquire Scheduled Lock
 * ========================================================================== */

const acquireScheduleLock =
    async (
        scheduleId,
        executionId
    ) => {
        if (
            !scheduleId ||
            !executionId
        ) {
            return null;
        }

        const now =
            new Date();

        const lockedUntil =
            addMinutes(
                now,
                DEFAULT_LOCK_MINUTES
            );

        try {
            return await ReportSchedule.findOneAndUpdate(
                {
                    _id: scheduleId,

                    enabled: true,

                    status: "active",

                    nextRunAt: {
                        $lte: now,
                    },

                    $or: [
                        {
                            "lock.lockedUntil":
                                null,
                        },
                        {
                            "lock.lockedUntil":
                                {
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
                            getSchedulerId(),

                        lastExecutionStatus:
                            "running",
                    },
                },
                {
                    new: true,
                }
            );
        } catch (error) {
            logError(
                "Schedule lock acquisition failed:",
                error.message
            );

            return null;
        }
    };

/* ============================================================================
 * Acquire Manual Lock
 * ========================================================================== */

const acquireManualScheduleLock =
    async (
        scheduleId,
        executionId
    ) => {
        if (
            !scheduleId ||
            !executionId
        ) {
            return null;
        }

        const now =
            new Date();

        const lockedUntil =
            addMinutes(
                now,
                DEFAULT_LOCK_MINUTES
            );

        try {
            return await ReportSchedule.findOneAndUpdate(
                {
                    _id: scheduleId,

                    enabled: true,

                    status: "active",

                    $or: [
                        {
                            "lock.lockedUntil":
                                null,
                        },
                        {
                            "lock.lockedUntil":
                                {
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
                            getSchedulerId(),

                        lastExecutionStatus:
                            "running",
                    },
                },
                {
                    new: true,
                }
            );
        } catch (error) {
            logError(
                "Manual lock acquisition failed:",
                error.message
            );

            return null;
        }
    };

/* ============================================================================
 * Lock Heartbeat
 *
 * Extends lock while report generation is still running.
 * ========================================================================== */

const refreshScheduleLock =
    async (
        scheduleId,
        executionId
    ) => {
        if (
            !scheduleId ||
            !executionId
        ) {
            return false;
        }

        try {
            const lockedUntil =
                addMinutes(
                    new Date(),
                    DEFAULT_LOCK_MINUTES
                );

            const result =
                await ReportSchedule.updateOne(
                    {
                        _id:
                            scheduleId,

                        "lock.executionId":
                            executionId,
                    },
                    {
                        $set: {
                            "lock.lockedUntil":
                                lockedUntil,
                        },
                    }
                );

            return (
                result &&
                result.modifiedCount > 0
            );
        } catch (error) {
            logError(
                "Lock heartbeat failed:",
                error.message
            );

            return false;
        }
    };

/* ============================================================================
 * Start Lock Heartbeat
 * ========================================================================== */

const startLockHeartbeat =
    (
        scheduleId,
        executionId
    ) => {
        const intervalMs =
            DEFAULT_HEARTBEAT_MINUTES *
            60 *
            1000;

        const timer =
            setInterval(
                () => {
                    refreshScheduleLock(
                        scheduleId,
                        executionId
                    ).catch(
                        (error) => {
                            logError(
                                "Heartbeat error:",
                                error.message
                            );
                        }
                    );
                },
                intervalMs
            );

        return timer;
    };

/* ============================================================================
 * Release Lock
 * ========================================================================== */

const releaseScheduleLock =
    async (
        scheduleId,
        executionId
    ) => {
        if (
            !scheduleId ||
            !executionId
        ) {
            return;
        }

        try {
            await ReportSchedule.updateOne(
                {
                    _id:
                        scheduleId,

                    "lock.executionId":
                        executionId,
                },
                {
                    $set: {
                        "lock.executionId":
                            null,

                        "lock.lockedAt":
                            null,

                        "lock.lockedUntil":
                            null,

                        "lock.lockedBy":
                            null,
                    },
                }
            );
        } catch (error) {
            logError(
                "Schedule lock release failed:",
                error.message
            );
        }
    };

/* ============================================================================
 * Find Due Schedules
 * ========================================================================== */

const findDueSchedules =
    async () => {
        const now =
            new Date();

        return ReportSchedule.find(
            {
                enabled: true,

                status: "active",

                nextRunAt: {
                    $lte: now,
                },

                $or: [
                    {
                        "lock.lockedUntil":
                            null,
                    },
                    {
                        "lock.lockedUntil":
                            {
                                $lte: now,
                            },
                    },
                ],
            }
        )
            .sort({
                nextRunAt: 1,
            })
            .limit(
                MAX_SCHEDULE_BATCH
            );
    };

/* ============================================================================
 * Generate Report
 * ========================================================================== */

const generateScheduledReport =
    async (
        schedule,
        executionContext
    ) => {
        if (
            !reportService ||
            typeof
                reportService.generateScheduledReport !==
                "function"
        ) {
            const error =
                new Error(
                    "reportService.generateScheduledReport is not available."
                );

            error.code =
                "REPORT_SERVICE_UNAVAILABLE";

            throw error;
        }

        const context =
            validateExecutionContext(
                schedule,
                executionContext
            );

        return reportService.generateScheduledReport(
            schedule,
            context
        );
    };

/* ============================================================================
 * Execute Report Attempt
 * ========================================================================== */

const executeReportAttempt =
    async (
        schedule,
        executionContext
    ) => {
        return generateScheduledReport(
            schedule,
            executionContext
        );
    };

/* ============================================================================
 * Finalize Successful Execution
 * ========================================================================== */

const finalizeSuccess =
    async ({
        schedule,
        executionId,
        startedAt,
        requestId,
        retryCount,
        result,
    }) => {
        const completedAt =
            new Date();

        const durationMs =
            completedAt.getTime() -
            startedAt.getTime();

        const nextRunAt =
            calculateNextRun(
                schedule,
                completedAt
            );

        const file =
            result?.data || {};

        const historyEntry =
            createHistoryEntry({
                executionId,

                startedAt,

                completedAt,

                status: "success",

                format:
                    file.format ||
                    schedule.format ||
                    null,

                filename:
                    file.filename ||
                    file.fileName ||
                    null,

                size:
                    file.size || 0,

                durationMs,

                errorCode: null,

                errorMessage: null,

                retryCount,

                requestId,
            });

        return ReportSchedule.findOneAndUpdate(
            {
                _id:
                    schedule._id,

                "lock.executionId":
                    executionId,
            },
            {
                $set: {
                    lastRunAt:
                        completedAt,

                    lastSuccessAt:
                        completedAt,

                    lastFailureAt:
                        null,

                    lastExecutionStatus:
                        "success",

                    consecutiveFailures:
                        0,

                    nextRunAt,

                    "lock.executionId":
                        null,

                    "lock.lockedAt":
                        null,

                    "lock.lockedUntil":
                        null,

                    "lock.lockedBy":
                        null,
                },

                $inc: {
                    totalRuns: 1,

                    successfulRuns: 1,
                },

                $push: {
                    executionHistory: {
                        $each: [
                            historyEntry,
                        ],

                        $slice:
                            -MAX_HISTORY_ITEMS,
                    },
                },
            },
            {
                new: true,
            }
        );
    };

/* ============================================================================
 * Finalize Failed Execution
 * ========================================================================== */

const finalizeFailure =
    async ({
        schedule,
        executionId,
        startedAt,
        requestId,
        retryCount,
        error,
    }) => {
        const completedAt =
            new Date();

        const durationMs =
            completedAt.getTime() -
            startedAt.getTime();

        const currentFailures =
            Number(
                schedule.consecutiveFailures
            ) || 0;

        const consecutiveFailures =
            currentFailures + 1;

        const disable =
            consecutiveFailures >=
            MAX_CONSECUTIVE_FAILURES;

        const nextRunAt =
            disable
                ? null
                : calculateNextRun(
                      schedule,
                      completedAt
                  );

        const historyEntry =
            createHistoryEntry({
                executionId,

                startedAt,

                completedAt,

                status: "failed",

                format:
                    schedule.format ||
                    null,

                filename: null,

                size: 0,

                durationMs,

                errorCode:
                    error?.code ||
                    "REPORT_SCHEDULE_EXECUTION_ERROR",

                errorMessage:
                    error?.message ||
                    "Scheduled report execution failed.",

                retryCount,

                requestId,
            });

        return ReportSchedule.findOneAndUpdate(
            {
                _id:
                    schedule._id,

                "lock.executionId":
                    executionId,
            },
            {
                $set: {
                    lastRunAt:
                        completedAt,

                    lastFailureAt:
                        completedAt,

                    lastExecutionStatus:
                        "failed",

                    consecutiveFailures,

                    nextRunAt,

                    status:
                        disable
                            ? "failed"
                            : "active",

                    enabled:
                        disable
                            ? false
                            : schedule.enabled,

                    "lock.executionId":
                        null,

                    "lock.lockedAt":
                        null,

                    "lock.lockedUntil":
                        null,

                    "lock.lockedBy":
                        null,
                },

                $inc: {
                    totalRuns: 1,

                    failedRuns: 1,
                },

                $push: {
                    executionHistory: {
                        $each: [
                            historyEntry,
                        ],

                        $slice:
                            -MAX_HISTORY_ITEMS,
                    },
                },
            },
            {
                new: true,
            }
        );
    };

/* ============================================================================
 * Execute Locked Schedule
 *
 * IMPORTANT:
 * All retries happen under ONE distributed lock.
 * Statistics are updated ONCE.
 * ========================================================================== */

const executeLockedSchedule =
    async (
        schedule,
        options = {}
    ) => {
        if (
            !schedule ||
            !schedule._id
        ) {
            return {
                success: false,

                skipped: true,

                reason:
                    "Invalid locked schedule.",
            };
        }

        const executionId =
            options.executionId ||
            schedule.lock?.executionId ||
            createExecutionId();

        const startedAt =
            options.startedAt ||
            new Date();

        const manual =
            Boolean(
                options.manual
            );

        const maxRetries =
            Number.isInteger(
                Number(
                    options.maxRetries
                )
            )
                ? Math.max(
                      0,
                      Number(
                          options.maxRetries
                      )
                  )
                : DEFAULT_RETRY_COUNT;

        const requestId =
            options.requestId ||
            (
                manual
                    ? `manual-report-${executionId}`
                    : `report-request-${executionId}`
            );

        let retryCount = 0;

        let heartbeatTimer =
            null;

        try {
            heartbeatTimer =
                startLockHeartbeat(
                    schedule._id,
                    executionId
                );

            while (true) {
                try {
                    const executionContext =
                        validateExecutionContext(
                            schedule,
                            {
                                executionDate:
                                    startedAt,

                                requestId,

                                userId:
                                    schedule.createdBy ||
                                    null,

                                tenantId:
                                    schedule.tenantId ||
                                    null,

                                executionId,

                                manual,

                                retryCount,
                            }
                        );

                    log(
                        `${manual ? "Manual" : "Scheduled"} execution ` +
                        `${schedule._id}, attempt ${retryCount + 1}`
                    );

                    const result =
                        await executeReportAttempt(
                            schedule,
                            executionContext
                        );

                    if (
                        !result ||
                        !result.success
                    ) {
                        const error =
                            new Error(
                                result?.message ||
                                    result?.error ||
                                    "Report generation failed."
                            );

                        error.code =
                            result?.code ||
                            "REPORT_SCHEDULE_EXECUTION_ERROR";

                        throw error;
                    }

                    const updated =
                        await finalizeSuccess({
                            schedule,

                            executionId,

                            startedAt,

                            requestId,

                            retryCount,

                            result,
                        });

                    if (!updated) {
                        const error =
                            new Error(
                                "Unable to finalize successful report execution."
                            );

                        error.code =
                            "REPORT_SCHEDULE_FINALIZATION_FAILED";

                        throw error;
                    }

                    return {
                        success: true,

                        scheduleId:
                            schedule._id,

                        executionId,

                        retryCount,

                        nextRunAt:
                            updated.nextRunAt,

                        schedule:
                            updated,

                        result,
                    };
                } catch (error) {
                    if (
                        retryCount >=
                        maxRetries
                    ) {
                        const updated =
                            await finalizeFailure({
                                schedule,

                                executionId,

                                startedAt,

                                requestId,

                                retryCount,

                                error,
                            });

                        logError(
                            `Schedule ${schedule._id} failed after ` +
                            `${retryCount} retry(s):`,
                            error.message
                        );

                        return {
                            success: false,

                            scheduleId:
                                schedule._id,

                            executionId,

                            retryCount,

                            retriesExhausted:
                                true,

                            error:
                                error.message,

                            code:
                                error.code ||
                                "REPORT_SCHEDULE_EXECUTION_ERROR",

                            schedule:
                                updated,
                        };
                    }

                    retryCount += 1;

                    const delay =
                        calculateRetryDelay(
                            retryCount - 1
                        );

                    log(
                        `Retry ${retryCount}/${maxRetries} ` +
                        `for schedule ${schedule._id} ` +
                        `after ${delay}ms.`
                    );

                    await sleep(
                        delay
                    );
                }
            }
        } finally {
            if (
                heartbeatTimer
            ) {
                clearInterval(
                    heartbeatTimer
                );
            }

            await releaseScheduleLock(
                schedule._id,
                executionId
            );
        }
    };

/* ============================================================================
 * Execute Scheduled Schedule
 * ========================================================================== */

const executeSchedule =
    async (
        schedule,
        options = {}
    ) => {
        if (
            !schedule ||
            !schedule._id
        ) {
            return {
                success: false,

                skipped: true,

                reason:
                    "Invalid report schedule.",
            };
        }

        const executionId =
            createExecutionId();

        const lockedSchedule =
            await acquireScheduleLock(
                schedule._id,
                executionId
            );

        if (
            !lockedSchedule
        ) {
            return {
                success: false,

                skipped: true,

                reason:
                    "Schedule already locked or no longer due.",
            };
        }

        return executeLockedSchedule(
            lockedSchedule,
            {
                executionId,

                manual: false,

                maxRetries:
                    options.maxRetries,
            }
        );
    };

/* ============================================================================
 * Manual Schedule Execution
 * ========================================================================== */

const runScheduleNow =
    async (
        scheduleId,
        options = {}
    ) => {
        if (!scheduleId) {
            return {
                success: false,

                message:
                    "Schedule ID is required.",
            };
        }

        try {
            const schedule =
                await ReportSchedule.findById(
                    scheduleId
                );

            if (!schedule) {
                return {
                    success: false,

                    message:
                        "Report schedule not found.",
                };
            }

            if (
                !schedule.enabled
            ) {
                return {
                    success: false,

                    message:
                        "Report schedule is disabled.",
                };
            }

            if (
                schedule.status !==
                "active"
            ) {
                return {
                    success: false,

                    message:
                        "Report schedule is not active.",
                };
            }

            const executionId =
                createExecutionId();

            const lockedSchedule =
                await acquireManualScheduleLock(
                    schedule._id,
                    executionId
                );

            if (
                !lockedSchedule
            ) {
                return {
                    success: false,

                    skipped: true,

                    message:
                        "Schedule is currently locked.",
                };
            }

            return executeLockedSchedule(
                lockedSchedule,
                {
                    executionId,

                    manual: true,

                    maxRetries:
                        options.maxRetries,
                }
            );
        } catch (error) {
            logError(
                "Manual schedule execution failed:",
                error.message
            );

            return {
                success: false,

                message:
                    error.message ||
                    "Unable to execute schedule.",
            };
        }
    };

/* ============================================================================
 * Scheduler Cycle
 * ========================================================================== */

const runSchedulerCycle =
    async () => {
        if (
            schedulerStopping
        ) {
            return;
        }

        if (
            schedulerRunning
        ) {
            log(
                "Previous scheduler cycle is still running. Skipping."
            );

            return;
        }

        schedulerRunning =
            true;

        try {
            await releaseExpiredLocks();

            const schedules =
                await findDueSchedules();

            if (
                !schedules ||
                schedules.length === 0
            ) {
                return;
            }

            log(
                `Found ${schedules.length} due report schedule(s).`
            );

            for (
                const schedule of
                schedules
            ) {
                if (
                    schedulerStopping
                ) {
                    break;
                }

                try {
                    await executeSchedule(
                        schedule
                    );
                } catch (error) {
                    logError(
                        "Schedule execution error:",
                        error.message
                    );
                }
            }
        } catch (error) {
            logError(
                "Scheduler cycle failed:",
                error.message
            );
        } finally {
            schedulerRunning =
                false;
        }
    };

/* ============================================================================
 * Start Scheduler
 * ========================================================================== */

const startReportScheduler =
    (
        options = {}
    ) => {
        if (
            schedulerTimer
        ) {
            log(
                "Report scheduler is already running."
            );

            return schedulerTimer;
        }

        schedulerStopping =
            false;

        const intervalMs =
            Number(
                options.intervalMs
            ) ||
            Number(
                process.env.REPORT_SCHEDULER_INTERVAL_MS
            ) ||
            DEFAULT_INTERVAL_MS;

        log(
            `Starting report scheduler. Interval: ${intervalMs}ms`
        );

        runSchedulerCycle()
            .catch(
                (error) => {
                    logError(
                        "Initial scheduler cycle failed:",
                        error.message
                    );
                }
            );

        schedulerTimer =
            setInterval(
                () => {
                    runSchedulerCycle()
                        .catch(
                            (error) => {
                                logError(
                                    "Scheduler cycle failed:",
                                    error.message
                                );
                            }
                        );
                },
                intervalMs
            );

        return schedulerTimer;
    };

/* ============================================================================
 * Stop Scheduler
 * ========================================================================== */

const stopReportScheduler =
    () => {
        schedulerStopping =
            true;

        if (
            !schedulerTimer
        ) {
            log(
                "Report scheduler is not running."
            );

            return;
        }

        clearInterval(
            schedulerTimer
        );

        schedulerTimer =
            null;

        log(
            "Report scheduler stopped."
        );
    };

/* ============================================================================
 * Scheduler Status
 * ========================================================================== */

const getSchedulerStatus =
    () => {
        return {
            running:
                Boolean(
                    schedulerTimer
                ),

            cycleRunning:
                schedulerRunning,

            stopping:
                schedulerStopping,

            schedulerId:
                getSchedulerId(),

            intervalMs:
                Number(
                    process.env.REPORT_SCHEDULER_INTERVAL_MS
                ) ||
                DEFAULT_INTERVAL_MS,

            lockDurationMinutes:
                DEFAULT_LOCK_MINUTES,

            heartbeatMinutes:
                DEFAULT_HEARTBEAT_MINUTES,

            maxHistoryItems:
                MAX_HISTORY_ITEMS,

            maxConsecutiveFailures:
                MAX_CONSECUTIVE_FAILURES,

            defaultRetryCount:
                DEFAULT_RETRY_COUNT,

            defaultRetryDelayMs:
                DEFAULT_RETRY_DELAY_MS,

            maxRetryDelayMs:
                MAX_RETRY_DELAY_MS,
        };
    };

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = {
    startReportScheduler,

    stopReportScheduler,

    runSchedulerCycle,

    findDueSchedules,

    executeSchedule,

    executeLockedSchedule,

    runScheduleNow,

    calculateNextRun,

    calculateRetryDelay,

    acquireScheduleLock,

    acquireManualScheduleLock,

    refreshScheduleLock,

    releaseScheduleLock,

    releaseExpiredLocks,

    getSchedulerStatus,
};

/**
 * ============================================================================
 * End reportScheduler.js
 * ============================================================================
 */
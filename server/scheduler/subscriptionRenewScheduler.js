/******************************************************************************
 * scheduler/subscriptionRenewScheduler.js
 * Part 1
 * Imports + Configuration + Logger + Scheduler Setup
 ******************************************************************************/

const cron = require("node-cron");

const graphWebhookService = require("../services/graphWebhookService");

/* ==========================================================================
   Configuration
========================================================================== */

const RENEW_CRON =
  process.env.GRAPH_RENEW_CRON || "*/30 * * * *";

const RENEW_THRESHOLD_MINUTES =
  Number(process.env.GRAPH_RENEW_THRESHOLD || 60);

const TIMEZONE =
  process.env.TZ || "Asia/Kolkata";

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, data = {}) => {
  console.log(
    `[Subscription Scheduler] ${message}`,
    data
  );
};

const errorLog = (message, error) => {
  console.error(
    `[Subscription Scheduler] ${message}`,
    error?.message || error
  );
};

/* ==========================================================================
   Scheduler Instance
========================================================================== */

let scheduler = null;

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Cleanup Invalid / Expired Subscriptions
 ******************************************************************************/

const cleanupSubscriptions = async () => {

    try {

        log("Checking expired subscriptions...");

        const result =
            await graphWebhookService.listSubscriptions();

        const deleted = [];
        const skipped = [];

        for (const subscription of result.subscriptions || []) {

            const expiresAt =
                new Date(subscription.expirationDateTime);

            if (expiresAt <= new Date()) {

                try {

                    await graphWebhookService.deleteSubscription(
                        subscription.id
                    );

                    deleted.push(subscription.id);

                    log("Deleted", {
                        id: subscription.id,
                    });

                } catch (err) {

                    errorLog("Delete Failed", err);

                }

            } else {

                skipped.push(subscription.id);

            }

        }

        return {
            success: true,
            deletedCount: deleted.length,
            skippedCount: skipped.length,
            deleted,
            skipped,
        };

    } catch (error) {

        errorLog("Cleanup Failed", error);

        return {
            success: false,
            message: error.message,
        };

    }

};


/******************************************************************************
 * Validate Active Subscriptions
 ******************************************************************************/

const validateSubscriptions = async () => {

    try {

        log("Validating subscriptions...");

        const result =
            await graphWebhookService.listSubscriptions();

        const valid = [];
        const invalid = [];

        for (const subscription of result.subscriptions || []) {

            const status =
                await graphWebhookService.validateSubscription(
                    subscription.id
                );

            if (status.valid) {

                valid.push(subscription.id);

            } else {

                invalid.push(subscription.id);

            }

        }

        return {

            success: true,

            validCount: valid.length,

            invalidCount: invalid.length,

            valid,

            invalid,

        };

    } catch (error) {

        errorLog("Validation Failed", error);

        return {

            success: false,

            message: error.message,

        };

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Renew Expiring Subscriptions
 ******************************************************************************/

const renewExpiringSubscriptions = async () => {

    try {

        log("Checking subscriptions for renewal...");

        const result =
            await graphWebhookService.listSubscriptions();

        const renewed = [];
        const skipped = [];

        for (const subscription of result.subscriptions || []) {

            const expiry =
                new Date(subscription.expirationDateTime);

            const remainingMinutes =
                Math.floor(
                    (expiry - new Date()) /
                    (1000 * 60)
                );

            if (remainingMinutes <= RENEW_THRESHOLD_MINUTES) {

                try {

                    const renewedSubscription =
                        await graphWebhookService.renewSubscription(
                            subscription.id
                        );

                    renewed.push({
                        id: subscription.id,
                        expirationDateTime:
                            renewedSubscription.subscription
                                .expirationDateTime,
                    });

                    log("Subscription Renewed", {
                        id: subscription.id,
                    });

                } catch (err) {

                    errorLog(
                        "Renew Failed",
                        err
                    );

                }

            } else {

                skipped.push({
                    id: subscription.id,
                    remainingMinutes,
                });

            }

        }

        return {

            success: true,

            renewedCount:
                renewed.length,

            skippedCount:
                skipped.length,

            renewed,

            skipped,

        };

    } catch (error) {

        errorLog(
            "Renew Process Failed",
            error
        );

        return {

            success: false,

            message:
                error.message,

        };

    }

};


/******************************************************************************
 * Execute Complete Scheduler Job
 ******************************************************************************/

const executeSchedulerJob = async () => {

    try {

        log("Scheduler Job Started");

        const renewed =
            await renewExpiringSubscriptions();

        const cleaned =
            await cleanupSubscriptions();

        const validated =
            await validateSubscriptions();

        log("Scheduler Job Finished");

        return {

            success: true,

            renewed,

            cleaned,

            validated,

            executedAt:
                new Date().toISOString(),

        };

    } catch (error) {

        errorLog(
            "Scheduler Job Failed",
            error
        );

        return {

            success: false,

            message:
                error.message,

            executedAt:
                new Date().toISOString(),

        };

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Start Scheduler
 ******************************************************************************/

const startScheduler = () => {

    try {

        if (scheduler) {

            log("Scheduler already running.");

            return scheduler;

        }

        scheduler = cron.schedule(

            RENEW_CRON,

            async () => {

                await executeSchedulerJob();

            },

            {

                scheduled: true,

                timezone: TIMEZONE,

            }

        );

        log("Scheduler Started", {

            cron: RENEW_CRON,

            timezone: TIMEZONE,

            threshold: RENEW_THRESHOLD_MINUTES,

        });

        return scheduler;

    }

    catch (error) {

        errorLog(

            "Failed to start scheduler",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Stop Scheduler
 ******************************************************************************/

const stopScheduler = () => {

    try {

        if (!scheduler) {

            log("Scheduler is not running.");

            return false;

        }

        scheduler.stop();

        scheduler.destroy();

        scheduler = null;

        log("Scheduler Stopped");

        return true;

    }

    catch (error) {

        errorLog(

            "Failed to stop scheduler",

            error

        );

        return false;

    }

};


/******************************************************************************
 * Restart Scheduler
 ******************************************************************************/

const restartScheduler = async () => {

    try {

        stopScheduler();

        startScheduler();

        log("Scheduler Restarted");

        return {

            success: true,

            message:

                "Scheduler restarted successfully.",

            timestamp:

                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Restart failed",

            error

        );

        return {

            success: false,

            message:

                error.message,

        };

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Manual Scheduler Trigger
 ******************************************************************************/

const triggerScheduler = async () => {

    try {

        log("Manual scheduler execution started.");

        const result =
            await executeSchedulerJob();

        return {

            success: true,

            message:
                "Scheduler executed successfully.",

            result,

            timestamp:
                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(
            "Manual Trigger Failed",
            error
        );

        return {

            success: false,

            message:
                error.message,

            timestamp:
                new Date().toISOString(),

        };

    }

};


/******************************************************************************
 * Get Scheduler Status
 ******************************************************************************/

const getSchedulerStatus = () => {

    return {

        success: true,

        running:
            scheduler !== null,

        cron:
            RENEW_CRON,

        timezone:
            TIMEZONE,

        renewThreshold:
            RENEW_THRESHOLD_MINUTES,

        checkedAt:
            new Date().toISOString(),

    };

};


/******************************************************************************
 * Scheduler Health Check
 ******************************************************************************/

const schedulerHealth = async () => {

    try {

        const webhookHealth =
            await graphWebhookService.webhookHealth();

        return {

            success: true,

            schedulerRunning:
                scheduler !== null,

            webhook:
                webhookHealth,

            cron:
                RENEW_CRON,

            timezone:
                TIMEZONE,

            checkedAt:
                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(
            "Health Check Failed",
            error
        );

        return {

            success: false,

            message:
                error.message,

            checkedAt:
                new Date().toISOString(),

        };

    }

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    /* Core Jobs */

    renewExpiringSubscriptions,
    cleanupSubscriptions,
    validateSubscriptions,
    executeSchedulerJob,

    /* Scheduler Controls */

    startScheduler,
    stopScheduler,
    restartScheduler,

    /* Manual Operations */

    triggerScheduler,

    /* Monitoring */

    getSchedulerStatus,
    schedulerHealth,

};


/******************************************************************************
 * Auto Start Scheduler (Production)
 ******************************************************************************/

if (process.env.NODE_ENV === "production") {

    startScheduler();

}


/******************************************************************************
 * Graceful Shutdown
 ******************************************************************************/

const gracefulShutdown = () => {

    log("Scheduler shutting down...");

    stopScheduler();

    process.exit(0);

};

process.on("SIGINT", gracefulShutdown);

process.on("SIGTERM", gracefulShutdown);


/******************************************************************************
 * End subscriptionRenewScheduler.js
 ******************************************************************************/
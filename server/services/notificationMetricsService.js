/******************************************************************************
 * services/notificationMetricsService.js
 * Part 1
 * Configuration + Metrics Store + Logger
 ******************************************************************************/

/* ==========================================================================
   Configuration
========================================================================== */

const METRICS_RETENTION_DAYS =
    Number(process.env.NOTIFICATION_METRICS_RETENTION || 90);

const CLEANUP_INTERVAL =
    Number(
        process.env.NOTIFICATION_METRICS_CLEANUP_INTERVAL ||
        60 * 60 * 1000
    );

/* ==========================================================================
   Metrics Store
========================================================================== */

const metrics = {

    totalNotifications: 0,

    delivered: 0,

    failed: 0,

    retries: 0,

    email: 0,

    browser: 0,

    push: 0,

    sms: 0,

};

/* ==========================================================================
   Metrics History
========================================================================== */

const metricsHistory = [];

/* ==========================================================================
   Logger
========================================================================== */

const log = (

    message,

    payload = {}

) => {

    console.log(

        `[Notification Metrics] ${message}`,

        payload

    );

};

const errorLog = (

    message,

    error

) => {

    console.error(

        `[Notification Metrics] ${message}`,

        error?.message || error

    );

};

/******************************************************************************
 * Metrics Snapshot Factory
 ******************************************************************************/

const createMetricSnapshot = () => ({

    timestamp:

        new Date(),

    ...metrics,

});

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Record Notification Delivery
 ******************************************************************************/

const recordDelivery = (channel = "email") => {

    metrics.totalNotifications++;

    metrics.delivered++;

    if (metrics[channel] !== undefined) {

        metrics[channel]++;

    }

    metricsHistory.push(

        createMetricSnapshot()

    );

    log(

        "Notification Delivered",

        {

            channel,

        }

    );

};


/******************************************************************************
 * Record Notification Failure
 ******************************************************************************/

const recordFailure = (channel = "email") => {

    metrics.totalNotifications++;

    metrics.failed++;

    if (metrics[channel] !== undefined) {

        metrics[channel]++;

    }

    metricsHistory.push(

        createMetricSnapshot()

    );

    log(

        "Notification Failed",

        {

            channel,

        }

    );

};


/******************************************************************************
 * Record Retry
 ******************************************************************************/

const recordRetry = () => {

    metrics.retries++;

    metricsHistory.push(

        createMetricSnapshot()

    );

    log(

        "Retry Recorded"

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Metrics Summary
 ******************************************************************************/

const getMetrics = () => {

    return {

        success: true,

        ...metrics,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Get Success Rate
 ******************************************************************************/

const getSuccessRate = () => {

    const rate =

        metrics.totalNotifications === 0

            ? 0

            : (

                (metrics.delivered /

                metrics.totalNotifications) * 100

            ).toFixed(2);

    return {

        success: true,

        successRate:

            Number(rate),

    };

};


/******************************************************************************
 * Get Failure Rate
 ******************************************************************************/

const getFailureRate = () => {

    const rate =

        metrics.totalNotifications === 0

            ? 0

            : (

                (metrics.failed /

                metrics.totalNotifications) * 100

            ).toFixed(2);

    return {

        success: true,

        failureRate:

            Number(rate),

    };

};


/******************************************************************************
 * Get Metrics History
 ******************************************************************************/

const getMetricsHistory = (

    limit = 100

) => {

    return metricsHistory.slice(

        -limit

    );

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Cleanup Metrics History
 ******************************************************************************/

const cleanupMetrics = () => {

    try {

        const cutoff = new Date();

        cutoff.setDate(

            cutoff.getDate() -

            METRICS_RETENTION_DAYS

        );

        const before =

            metricsHistory.length;

        const filtered =

            metricsHistory.filter(

                metric =>

                    new Date(metric.timestamp) >= cutoff

            );

        metricsHistory.length = 0;

        metricsHistory.push(...filtered);

        log(

            "Metrics Cleanup Completed",

            {

                removed:

                    before - filtered.length,

            }

        );

        return {

            success: true,

            removed:

                before - filtered.length,

        };

    }

    catch (error) {

        errorLog(

            "Cleanup Failed",

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
 * Metrics Health
 ******************************************************************************/

const metricsHealth = () => {

    return {

        success: true,

        service:

            "Notification Metrics Service",

        status: "Healthy",

        totalNotifications:

            metrics.totalNotifications,

        delivered:

            metrics.delivered,

        failed:

            metrics.failed,

        retries:

            metrics.retries,

        historyRecords:

            metricsHistory.length,

        checkedAt:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Exports
 ******************************************************************************/

module.exports = {

    recordDelivery,

    recordFailure,

    recordRetry,

    getMetrics,

    getSuccessRate,

    getFailureRate,

    getMetricsHistory,

    cleanupMetrics,

    metricsHealth,

};

/******************************************************************************
 * End notificationMetricsService.js
 ******************************************************************************/
/******************************************************************************
 * services/deadLetterQueueService.js
 * Part 1
 * Imports + Configuration + Dead Letter Queue Initialization
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const EventEmitter = require("events");

/* ==========================================================================
   Configuration
========================================================================== */

const MAX_DLQ_SIZE =
    Number(process.env.DEAD_LETTER_QUEUE_SIZE || 5000);

const DLQ_RETENTION_DAYS =
    Number(process.env.DLQ_RETENTION_DAYS || 30);

const AUTO_CLEANUP_INTERVAL =
    Number(process.env.DLQ_CLEANUP_INTERVAL || 60 * 60 * 1000);

/* ==========================================================================
   Dead Letter Queue
========================================================================== */

const deadLetterQueue = [];

/* ==========================================================================
   Event Bus
========================================================================== */

class DeadLetterQueueEmitter extends EventEmitter {}

const dlqEmitter = new DeadLetterQueueEmitter();

dlqEmitter.setMaxListeners(100);

/* ==========================================================================
   Statistics
========================================================================== */

let totalFailedJobs = 0;

let restoredJobs = 0;

let deletedJobs = 0;

let cleanedJobs = 0;

/* ==========================================================================
   Logger
========================================================================== */

const log = (

    message,

    payload = {}

) => {

    console.log(

        `[DeadLetterQueue] ${message}`,

        payload

    );

};

const errorLog = (

    message,

    error

) => {

    console.error(

        `[DeadLetterQueue] ${message}`,

        error?.message || error

    );

};

/* ==========================================================================
   Dead Letter Job Factory
========================================================================== */

const createDeadLetterJob = (

    job,

    reason = "UNKNOWN"

) => ({

    id: job.id,

    notification: job.notification,

    retry: job.retry || 0,

    reason,

    status: "FAILED",

    failedAt: new Date(),

    restored: false,

});

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Add Failed Job To Dead Letter Queue
 ******************************************************************************/

const addFailedJob = async (

    job,

    reason = "UNKNOWN_ERROR"

) => {

    try {

        if (

            deadLetterQueue.length >=

            MAX_DLQ_SIZE

        ) {

            throw new Error(

                "Dead Letter Queue is full."

            );

        }

        const failedJob =

            createDeadLetterJob(

                job,

                reason

            );

        deadLetterQueue.push(

            failedJob

        );

        totalFailedJobs++;

        dlqEmitter.emit(

            "job_added",

            failedJob

        );

        log(

            "Failed Job Added",

            {

                id: failedJob.id,

                reason,

                queueSize:

                    deadLetterQueue.length,

            }

        );

        return failedJob;

    }

    catch (error) {

        errorLog(

            "Add Failed Job",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Get All Failed Jobs
 ******************************************************************************/

const getFailedJobs = () => {

    return deadLetterQueue;

};


/******************************************************************************
 * Get Failed Job By Id
 ******************************************************************************/

const getFailedJob = (

    jobId

) => {

    return deadLetterQueue.find(

        job => job.id === jobId

    ) || null;

};


/******************************************************************************
 * Check Job Exists
 ******************************************************************************/

const hasFailedJob = (

    jobId

) => {

    return deadLetterQueue.some(

        job => job.id === jobId

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Restore Failed Job
 ******************************************************************************/

const restoreFailedJob = async (

    jobId,

    queueService

) => {

    try {

        const index = deadLetterQueue.findIndex(

            job => job.id === jobId

        );

        if (index === -1) {

            throw new Error(

                "Failed job not found."

            );

        }

        const job = deadLetterQueue[index];

        job.retry = 0;

        job.status = "RESTORED";

        job.restored = true;

        job.restoredAt = new Date();

        await queueService.addToQueue({

            ...job.notification,

        });

        deadLetterQueue.splice(

            index,

            1

        );

        restoredJobs++;

        dlqEmitter.emit(

            "job_restored",

            job

        );

        log(

            "Job Restored",

            {

                id: job.id,

            }

        );

        return {

            success: true,

            job,

        };

    }

    catch (error) {

        errorLog(

            "Restore Failed",

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
 * Restore All Failed Jobs
 ******************************************************************************/

const restoreAllFailedJobs = async (

    queueService

) => {

    try {

        let count = 0;

        while (deadLetterQueue.length > 0) {

            const job =

                deadLetterQueue.shift();

            job.retry = 0;

            job.status = "RESTORED";

            job.restored = true;

            job.restoredAt = new Date();

            await queueService.addToQueue({

                ...job.notification,

            });

            restoredJobs++;

            count++;

        }

        log(

            "All Failed Jobs Restored",

            {

                restored: count,

            }

        );

        return {

            success: true,

            restored: count,

        };

    }

    catch (error) {

        errorLog(

            "Restore All Failed",

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
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Delete Failed Job
 ******************************************************************************/

const deleteFailedJob = (jobId) => {

    try {

        const index = deadLetterQueue.findIndex(

            job => job.id === jobId

        );

        if (index === -1) {

            throw new Error(

                "Failed job not found."

            );

        }

        const deletedJob =

            deadLetterQueue.splice(index, 1)[0];

        deletedJobs++;

        dlqEmitter.emit(

            "job_deleted",

            deletedJob

        );

        log(

            "Failed Job Deleted",

            {

                id: deletedJob.id,

            }

        );

        return {

            success: true,

            deletedJob,

        };

    }

    catch (error) {

        errorLog(

            "Delete Failed Job",

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
 * Clear Dead Letter Queue
 ******************************************************************************/

const clearDeadLetterQueue = () => {

    try {

        const count =

            deadLetterQueue.length;

        deadLetterQueue.length = 0;

        deletedJobs += count;

        dlqEmitter.emit(

            "queue_cleared",

            {

                deleted: count,

            }

        );

        log(

            "Dead Letter Queue Cleared",

            {

                deleted: count,

            }

        );

        return {

            success: true,

            deleted: count,

        };

    }

    catch (error) {

        errorLog(

            "Clear Dead Letter Queue",

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
 * Cleanup Expired Failed Jobs
 ******************************************************************************/

const cleanupExpiredJobs = () => {

    try {

        const now = new Date();

        const before =

            deadLetterQueue.length;

        const filtered =

            deadLetterQueue.filter(job => {

                const ageInDays =

                    (now - new Date(job.failedAt)) /

                    (1000 * 60 * 60 * 24);

                return ageInDays < DLQ_RETENTION_DAYS;

            });

        cleanedJobs +=

            before - filtered.length;

        deadLetterQueue.length = 0;

        deadLetterQueue.push(...filtered);

        log(

            "Expired Jobs Cleaned",

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
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Dead Letter Queue Statistics
 ******************************************************************************/

const getDeadLetterQueueStats = () => {

    try {

        return {

            success: true,

            queueSize:
                deadLetterQueue.length,

            totalFailedJobs,

            restoredJobs,

            deletedJobs,

            cleanedJobs,

            maxQueueSize:
                MAX_DLQ_SIZE,

            retentionDays:
                DLQ_RETENTION_DAYS,

            timestamp:
                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Get Queue Stats",

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
 * Dead Letter Queue Health
 ******************************************************************************/

const deadLetterQueueHealth = () => {

    try {

        return {

            success: true,

            service:
                "Dead Letter Queue Service",

            status:

                deadLetterQueue.length < MAX_DLQ_SIZE

                    ? "Healthy"

                    : "Full",

            queueSize:
                deadLetterQueue.length,

            maxQueueSize:
                MAX_DLQ_SIZE,

            totalFailedJobs,

            restoredJobs,

            deletedJobs,

            cleanedJobs,

            checkedAt:
                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Health Check",

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
 * Queue Monitor
 ******************************************************************************/

const monitorDeadLetterQueue = () => {

    log(

        "DLQ Monitor",

        {

            queueSize:
                deadLetterQueue.length,

            totalFailedJobs,

            restoredJobs,

            deletedJobs,

            cleanedJobs,

        }

    );

};

/******************************************************************************
 * Auto Monitoring
 ******************************************************************************/

setInterval(

    monitorDeadLetterQueue,

    60000

);

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Initialize Dead Letter Queue
 ******************************************************************************/

const initializeDeadLetterQueue = () => {

    try {

        log(

            "Initializing Dead Letter Queue..."

        );

        /*
         * Auto Cleanup Scheduler
         */

        setInterval(

            () => {

                cleanupExpiredJobs();

            },

            AUTO_CLEANUP_INTERVAL

        );

        log(

            "Dead Letter Queue Initialized"

        );

        return true;

    }

    catch (error) {

        errorLog(

            "Initialization Failed",

            error

        );

        return false;

    }

};


/******************************************************************************
 * Shutdown Dead Letter Queue
 ******************************************************************************/

const shutdownDeadLetterQueue = () => {

    try {

        log(

            "Dead Letter Queue Shutdown"

        );

        return true;

    }

    catch (error) {

        errorLog(

            "Shutdown Failed",

            error

        );

        return false;

    }

};


/******************************************************************************
 * Auto Initialize (Production)
 ******************************************************************************/

if (

    process.env.NODE_ENV === "production"

) {

    initializeDeadLetterQueue();

}


/******************************************************************************
 * Graceful Shutdown
 ******************************************************************************/

process.on(

    "SIGINT",

    () => {

        shutdownDeadLetterQueue();

        process.exit(0);

    }

);

process.on(

    "SIGTERM",

    () => {

        shutdownDeadLetterQueue();

        process.exit(0);

    }

);


/******************************************************************************
 * Exports
 ******************************************************************************/

module.exports = {

    addFailedJob,

    getFailedJobs,

    getFailedJob,

    hasFailedJob,

    restoreFailedJob,

    restoreAllFailedJobs,

    deleteFailedJob,

    clearDeadLetterQueue,

    cleanupExpiredJobs,

    getDeadLetterQueueStats,

    deadLetterQueueHealth,

    monitorDeadLetterQueue,

    initializeDeadLetterQueue,

    shutdownDeadLetterQueue,

    dlqEmitter,

};

/******************************************************************************
 * End deadLetterQueueService.js
 ******************************************************************************/
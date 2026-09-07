/******************************************************************************
 * services/webhookQueueService.js
 * Part 1
 * Enterprise Webhook Queue Service
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const EventEmitter = require("events");

const outlookChangeProcessor =
    require("./outlookChangeProcessor");

/* ==========================================================================
   Configuration
========================================================================== */

const MAX_QUEUE_SIZE =
    Number(process.env.WEBHOOK_QUEUE_SIZE || 1000);

const MAX_CONCURRENT_WORKERS =
    Number(process.env.WEBHOOK_WORKERS || 5);

const MAX_RETRY =
    Number(process.env.WEBHOOK_MAX_RETRY || 3);

/* ==========================================================================
   Queue Storage
========================================================================== */

const queue = [];

const processingQueue = [];

const failedQueue = [];

/* ==========================================================================
   Event Bus
========================================================================== */

class QueueEmitter extends EventEmitter {}

const queueEmitter = new QueueEmitter();

queueEmitter.setMaxListeners(100);

/* ==========================================================================
   Queue State
========================================================================== */

let activeWorkers = 0;

let processedJobs = 0;

let failedJobs = 0;

let retryJobs = 0;

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, data = {}) => {

    console.log(

        `[Webhook Queue] ${message}`,

        data

    );

};

const errorLog = (message, error) => {

    console.error(

        `[Webhook Queue] ${message}`,

        error?.message || error

    );

};

/******************************************************************************
 * Queue Item Factory
 ******************************************************************************/

const createJob = (

    notification

) => ({

    id:

        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,

    notification,

    retry: 0,

    status: "PENDING",

    createdAt:

        new Date(),

});

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Add Job To Queue
 ******************************************************************************/

const addToQueue = async (notification) => {

    try {

        if (queue.length >= MAX_QUEUE_SIZE) {

            throw new Error("Queue is full.");

        }

        const job = createJob(notification);

        queue.push(job);

        log("Job Added", {
            id: job.id,
            queueSize: queue.length,
        });

        queueEmitter.emit("job_added", job);

        return job;

    }

    catch (error) {

        errorLog("Add Queue Failed", error);

        throw error;

    }

};


/******************************************************************************
 * Get Next Job
 ******************************************************************************/

const getNextJob = () => {

    if (!queue.length) {

        return null;

    }

    const job = queue.shift();

    job.status = "PROCESSING";

    processingQueue.push(job);

    return job;

};


/******************************************************************************
 * Remove Processing Job
 ******************************************************************************/

const removeProcessingJob = (jobId) => {

    const index = processingQueue.findIndex(

        job => job.id === jobId

    );

    if (index !== -1) {

        processingQueue.splice(index, 1);

    }

};


/******************************************************************************
 * Process Single Job
 ******************************************************************************/

const processJob = async (job) => {

    try {

        await outlookChangeProcessor.processChange(

            job.notification

        );

        processedJobs++;

        job.status = "COMPLETED";

        removeProcessingJob(job.id);

        queueEmitter.emit("job_completed", job);

        log("Job Completed", {

            id: job.id,

        });

    }

    catch (error) {

        errorLog("Job Failed", error);

        removeProcessingJob(job.id);

        await retryJob(job);

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Retry Failed Job
 ******************************************************************************/

const retryJob = async (job) => {

    try {

        if (job.retry < MAX_RETRY) {

            job.retry += 1;

            job.status = "RETRY";

            retryJobs++;

            queue.push(job);

            log("Job Requeued", {

                id: job.id,

                retry: job.retry,

            });

            queueEmitter.emit(

                "job_retry",

                job

            );

        }

        else {

            job.status = "FAILED";

            failedJobs++;

            failedQueue.push(job);

            log("Job Moved To Failed Queue", {

                id: job.id,

            });

            queueEmitter.emit(

                "job_failed",

                job

            );

        }

    }

    catch (error) {

        errorLog(

            "Retry Failed",

            error

        );

    }

};


/******************************************************************************
 * Worker Process
 ******************************************************************************/

const startWorker = async () => {

    if (

        activeWorkers >=

        MAX_CONCURRENT_WORKERS

    ) {

        return;

    }

    activeWorkers++;

    try {

        while (queue.length > 0) {

            const job =

                getNextJob();

            if (!job) break;

            await processJob(job);

        }

    }

    catch (error) {

        errorLog(

            "Worker Failed",

            error

        );

    }

    finally {

        activeWorkers--;

    }

};


/******************************************************************************
 * Auto Worker Trigger
 ******************************************************************************/

queueEmitter.on(

    "job_added",

    async () => {

        await startWorker();

    }

);

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Start Queue Processing
 ******************************************************************************/

const startQueue = async () => {

    try {

        log("Starting Queue Workers...");

        for (

            let i = 0;

            i < MAX_CONCURRENT_WORKERS;

            i++

        ) {

            startWorker();

        }

        return {

            success: true,

            workers:

                MAX_CONCURRENT_WORKERS,

            timestamp:

                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Start Queue Failed",

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
 * Stop Queue Processing
 ******************************************************************************/

const stopQueue = () => {

    try {

        activeWorkers = 0;

        log("Queue Processing Stopped");

        return {

            success: true,

            timestamp:

                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Stop Queue Failed",

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
 * Queue Statistics
 ******************************************************************************/

const getQueueStats = () => {

    return {

        success: true,

        queueSize:

            queue.length,

        processing:

            processingQueue.length,

        failed:

            failedQueue.length,

        activeWorkers,

        processedJobs,

        failedJobs,

        retryJobs,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Queue Health Check
 ******************************************************************************/

const queueHealth = () => {

    return {

        success: true,

        service:

            "Webhook Queue Service",

        status:

            activeWorkers <= MAX_CONCURRENT_WORKERS

                ? "Healthy"

                : "Busy",

        queueSize:

            queue.length,

        processing:

            processingQueue.length,

        failed:

            failedQueue.length,

        workers:

            activeWorkers,

        checkedAt:

            new Date().toISOString(),

    };

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Retry Failed Queue
 ******************************************************************************/

const retryFailedQueue = async () => {

    try {

        if (!failedQueue.length) {

            return {

                success: true,

                message: "No failed jobs found.",

                retried: 0,

            };

        }

        let retried = 0;

        while (failedQueue.length > 0) {

            const job = failedQueue.shift();

            job.retry = 0;

            job.status = "PENDING";

            queue.push(job);

            retried++;

        }

        log("Failed Queue Retried", {

            retried,

        });

        await startWorker();

        return {

            success: true,

            retried,

            timestamp:

                new Date().toISOString(),

        };

    }

    catch (error) {

        errorLog(

            "Retry Failed Queue",

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
 * Clear Failed Queue
 ******************************************************************************/

const clearFailedQueue = () => {

    const count = failedQueue.length;

    failedQueue.length = 0;

    log("Failed Queue Cleared", {

        count,

    });

    return {

        success: true,

        cleared: count,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Queue Monitor
 ******************************************************************************/

const monitorQueue = () => {

    return {

        queue: queue.length,

        processing:

            processingQueue.length,

        failed:

            failedQueue.length,

        workers:

            activeWorkers,

        processed:

            processedJobs,

        retries:

            retryJobs,

        failedJobs,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Auto Monitor
 ******************************************************************************/

setInterval(() => {

    log(

        "Queue Monitor",

        monitorQueue()

    );

}, 60000);

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Auto Start Queue
 ******************************************************************************/

const initializeQueue = async () => {

    try {

        log("Initializing Webhook Queue...");

        await startQueue();

        log("Webhook Queue Initialized");

        return true;

    }

    catch (error) {

        errorLog(

            "Queue Initialization Failed",

            error

        );

        return false;

    }

};


/******************************************************************************
 * Graceful Shutdown
 ******************************************************************************/

const shutdownQueue = () => {

    try {

        stopQueue();

        clearFailedQueue();

        log("Webhook Queue Shutdown Completed");

    }

    catch (error) {

        errorLog(

            "Shutdown Failed",

            error

        );

    }

};


/******************************************************************************
 * Auto Start In Production
 ******************************************************************************/

if (

    process.env.NODE_ENV === "production"

) {

    initializeQueue();

}


/******************************************************************************
 * Process Exit Handlers
 ******************************************************************************/

process.on(

    "SIGINT",

    () => {

        shutdownQueue();

        process.exit(0);

    }

);

process.on(

    "SIGTERM",

    () => {

        shutdownQueue();

        process.exit(0);

    }

);


/******************************************************************************
 * Exports
 ******************************************************************************/

module.exports = {

    addToQueue,

    processJob,

    startWorker,

    startQueue,

    stopQueue,

    retryFailedQueue,

    clearFailedQueue,

    getQueueStats,

    queueHealth,

    monitorQueue,

    initializeQueue,

    shutdownQueue,

    queueEmitter,

};

/******************************************************************************
 * End webhookQueueService.js
 ******************************************************************************/
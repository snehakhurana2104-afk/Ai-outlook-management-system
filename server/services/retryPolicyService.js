/******************************************************************************
 * services/retryPolicyService.js
 * Part 1
 * Imports + Configuration + Retry Policy Types
 ******************************************************************************/

/* ==========================================================================
   Retry Configuration
========================================================================== */

const DEFAULT_MAX_RETRIES =
    Number(process.env.RETRY_MAX_RETRIES || 3);

const DEFAULT_DELAY =
    Number(process.env.RETRY_DELAY || 1000);

const MAX_DELAY =
    Number(process.env.RETRY_MAX_DELAY || 30000);

/* ==========================================================================
   Retry Strategy Types
========================================================================== */

const RETRY_TYPES = {

    FIXED: "FIXED",

    LINEAR: "LINEAR",

    EXPONENTIAL: "EXPONENTIAL",

};

/* ==========================================================================
   Statistics
========================================================================== */

let totalRetries = 0;

let successfulRetries = 0;

let failedRetries = 0;

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, data = {}) => {

    console.log(

        `[Retry Policy] ${message}`,

        data

    );

};

const errorLog = (message, error) => {

    console.error(

        `[Retry Policy] ${message}`,

        error?.message || error

    );

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Retry Policy Builder
 ******************************************************************************/

const createRetryPolicy = ({

    type = RETRY_TYPES.EXPONENTIAL,

    maxRetries = DEFAULT_MAX_RETRIES,

    delay = DEFAULT_DELAY,

} = {}) => {

    return {

        type,

        maxRetries,

        delay,

    };

};


/******************************************************************************
 * Fixed Retry Delay
 ******************************************************************************/

const fixedDelay = (

    policy,

    retryCount

) => {

    return Math.min(

        policy.delay,

        MAX_DELAY

    );

};


/******************************************************************************
 * Linear Retry Delay
 ******************************************************************************/

const linearDelay = (

    policy,

    retryCount

) => {

    return Math.min(

        policy.delay *

        (retryCount + 1),

        MAX_DELAY

    );

};


/******************************************************************************
 * Exponential Retry Delay
 ******************************************************************************/

const exponentialDelay = (

    policy,

    retryCount

) => {

    return Math.min(

        policy.delay *

        Math.pow(

            2,

            retryCount

        ),

        MAX_DELAY

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Retry Delay
 ******************************************************************************/

const getRetryDelay = (

    policy,

    retryCount

) => {

    switch (policy.type) {

        case RETRY_TYPES.FIXED:

            return fixedDelay(

                policy,

                retryCount

            );

        case RETRY_TYPES.LINEAR:

            return linearDelay(

                policy,

                retryCount

            );

        case RETRY_TYPES.EXPONENTIAL:

        default:

            return exponentialDelay(

                policy,

                retryCount

            );

    }

};


/******************************************************************************
 * Sleep Helper
 ******************************************************************************/

const wait = (ms) =>

    new Promise(

        resolve =>

            setTimeout(

                resolve,

                ms

            )

    );


/******************************************************************************
 * Should Retry
 ******************************************************************************/

const shouldRetry = (

    retryCount,

    policy

) => {

    return (

        retryCount <

        policy.maxRetries

    );

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Execute Function With Retry
 ******************************************************************************/

const executeWithRetry = async (

    operation,

    policy = createRetryPolicy()

) => {

    let retryCount = 0;

    while (true) {

        try {

            const result =

                await operation();

            successfulRetries++;

            return result;

        }

        catch (error) {

            totalRetries++;

            if (

                !shouldRetry(

                    retryCount,

                    policy

                )

            ) {

                failedRetries++;

                errorLog(

                    "Maximum Retry Limit Reached",

                    error

                );

                throw error;

            }

            const delay =

                getRetryDelay(

                    policy,

                    retryCount

                );

            log(

                "Retry Attempt",

                {

                    retry:

                        retryCount + 1,

                    delay,

                }

            );

            retryCount++;

            await wait(delay);

        }

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Retry Statistics
 ******************************************************************************/

const getRetryStats = () => {

    return {

        success: true,

        totalRetries,

        successfulRetries,

        failedRetries,

        maxRetries:

            DEFAULT_MAX_RETRIES,

        defaultDelay:

            DEFAULT_DELAY,

        maxDelay:

            MAX_DELAY,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Retry Policy Health
 ******************************************************************************/

const retryPolicyHealth = () => {

    return {

        success: true,

        service:

            "Retry Policy Service",

        status: "Healthy",

        strategies:

            Object.values(RETRY_TYPES),

        totalRetries,

        successfulRetries,

        failedRetries,

        checkedAt:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Reset Statistics
 ******************************************************************************/

const resetRetryStats = () => {

    totalRetries = 0;

    successfulRetries = 0;

    failedRetries = 0;

    log("Retry Statistics Reset");

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Initialize Retry Policy Service
 ******************************************************************************/

const initializeRetryPolicy = () => {

    try {

        log(

            "Retry Policy Service Initialized"

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
 * Shutdown Retry Policy Service
 ******************************************************************************/

const shutdownRetryPolicy = () => {

    try {

        log(

            "Retry Policy Service Shutdown"

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
 * Exports
 ******************************************************************************/

module.exports = {

    RETRY_TYPES,

    createRetryPolicy,

    getRetryDelay,

    shouldRetry,

    executeWithRetry,

    getRetryStats,

    retryPolicyHealth,

    resetRetryStats,

    initializeRetryPolicy,

    shutdownRetryPolicy,

};


/******************************************************************************
 * End retryPolicyService.js
 ******************************************************************************/
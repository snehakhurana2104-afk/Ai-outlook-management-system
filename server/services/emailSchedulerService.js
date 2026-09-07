/******************************************************************************
 * services/emailSchedulerService.js
 * Part 1
 * Configuration + Scheduler Store + Logger
 ******************************************************************************/

/* ==========================================================================
   Configuration
========================================================================== */

const SCHEDULER_INTERVAL =
    Number(process.env.EMAIL_SCHEDULER_INTERVAL || 60000);

const MAX_SCHEDULED_EMAILS =
    Number(process.env.MAX_SCHEDULED_EMAILS || 5000);

/* ==========================================================================
   Scheduled Email Store
========================================================================== */

const scheduledEmails = [];

/* ==========================================================================
   Statistics
========================================================================== */

let totalScheduled = 0;
let totalSent = 0;
let totalCancelled = 0;
let totalFailed = 0;

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, payload = {}) => {

    console.log(

        `[Email Scheduler] ${message}`,

        payload

    );

};

const errorLog = (message, error) => {

    console.error(

        `[Email Scheduler] ${message}`,

        error?.message || error

    );

};

/* ==========================================================================
   Scheduled Email Factory
========================================================================== */

const createScheduledEmail = ({

    userId,

    to,

    subject,

    body,

    sendAt,

    metadata = {},

}) => ({

    id:
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,

    userId,

    to,

    subject,

    body,

    sendAt: new Date(sendAt),

    status: "PENDING",

    metadata,

    createdAt: new Date(),

});

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Schedule Email
 ******************************************************************************/

const scheduleEmail = (emailData) => {

    try {

        if (

            scheduledEmails.length >=

            MAX_SCHEDULED_EMAILS

        ) {

            throw new Error(

                "Maximum scheduled emails reached."

            );

        }

        const email =

            createScheduledEmail(emailData);

        scheduledEmails.push(email);

        totalScheduled++;

        log(

            "Email Scheduled",

            {

                id: email.id,

                to: email.to,

                sendAt: email.sendAt,

            }

        );

        return email;

    }

    catch (error) {

        errorLog(

            "Schedule Email Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Get Scheduled Email
 ******************************************************************************/

const getScheduledEmail = (id) => {

    return (

        scheduledEmails.find(

            email => email.id === id

        ) || null

    );

};


/******************************************************************************
 * Get All Scheduled Emails
 ******************************************************************************/

const getAllScheduledEmails = () => {

    return scheduledEmails;

};


/******************************************************************************
 * Cancel Scheduled Email
 ******************************************************************************/

const cancelScheduledEmail = (id) => {

    const email = getScheduledEmail(id);

    if (!email) {

        throw new Error(

            "Scheduled email not found."

        );

    }

    email.status = "CANCELLED";

    email.cancelledAt = new Date();

    totalCancelled++;

    log(

        "Scheduled Email Cancelled",

        {

            id,

        }

    );

    return email;

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Process Due Emails
 ******************************************************************************/

const processScheduledEmails = async (

    sendFunction

) => {

    const now = new Date();

    for (const email of scheduledEmails) {

        try {

            if (

                email.status !== "PENDING"

            ) {

                continue;

            }

            if (

                email.sendAt > now

            ) {

                continue;

            }

            await sendFunction(email);

            email.status = "SENT";

            email.sentAt = new Date();

            totalSent++;

            log(

                "Scheduled Email Sent",

                {

                    id: email.id,

                    to: email.to,

                }

            );

        }

        catch (error) {

            email.status = "FAILED";

            email.failedAt = new Date();

            email.error = error.message;

            totalFailed++;

            errorLog(

                "Scheduled Email Failed",

                error

            );

        }

    }

};


/******************************************************************************
 * Retry Failed Email
 ******************************************************************************/

const retryScheduledEmail = async (

    id,

    sendFunction

) => {

    const email =

        getScheduledEmail(id);

    if (!email) {

        throw new Error(

            "Scheduled email not found."

        );

    }

    email.status = "PENDING";

    email.error = null;

    email.failedAt = null;

    await processScheduledEmails(

        sendFunction

    );

    return email;

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Scheduler Statistics
 ******************************************************************************/

const getSchedulerStats = () => {

    return {

        success: true,

        totalScheduled,

        totalSent,

        totalCancelled,

        totalFailed,

        pending:

            scheduledEmails.filter(

                email => email.status === "PENDING"

            ).length,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Scheduler Health
 ******************************************************************************/

const schedulerHealth = () => {

    return {

        success: true,

        service:

            "Email Scheduler Service",

        status: "Healthy",

        queueSize:

            scheduledEmails.length,

        totalScheduled,

        totalSent,

        totalCancelled,

        totalFailed,

        checkedAt:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Auto Scheduler
 ******************************************************************************/

const initializeScheduler = (

    sendFunction

) => {

    log(

        "Email Scheduler Started"

    );

    setInterval(

        async () => {

            await processScheduledEmails(

                sendFunction

            );

        },

        SCHEDULER_INTERVAL

    );

};


/******************************************************************************
 * Exports
 ******************************************************************************/

module.exports = {

    scheduleEmail,

    getScheduledEmail,

    getAllScheduledEmails,

    cancelScheduledEmail,

    retryScheduledEmail,

    processScheduledEmails,

    getSchedulerStats,

    schedulerHealth,

    initializeScheduler,

};

/******************************************************************************
 * End emailSchedulerService.js
 ******************************************************************************/
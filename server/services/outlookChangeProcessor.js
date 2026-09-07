/******************************************************************************
 * services/outlookChangeProcessor.js
 * Part 1
 * Enterprise Outlook Change Processor
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const Email = require("../models/Email");

const Notification =
    require("../models/Notification");

const Task =
    require("../models/Task");

/* ==========================================================================
   Services
========================================================================== */

const graphService =
    require("./graphService");

const aiAnalyzer =
    require("./aiAnalyzer");

const notificationEngine =
    require("./notificationEngine");

const dashboardService =
    require("./dashboardService");

const analyticsService =
    require("./analyticsService");

const notificationEvents =
    require("../socket/notificationEvents");

/* ==========================================================================
   Configuration
========================================================================== */

const CHANGE_TYPES = {

    CREATED: "created",

    UPDATED: "updated",

    DELETED: "deleted",

};

/* ==========================================================================
   Enterprise Response Helpers
========================================================================== */

const success = (

    data = {},

    message = "Success"

) => ({

    success: true,

    message,

    data,

    timestamp:

        new Date().toISOString(),

});

const failure = (

    error

) => ({

    success: false,

    message:

        error.message ||

        "Processor Error",

    timestamp:

        new Date().toISOString(),

});

/* ==========================================================================
   Logging Helper
========================================================================== */

const log = (

    event,

    payload = {}

) => {

    console.log(

        `[Outlook Change Processor] ${event}`,

        payload

    );

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * processChange()
 * Main Outlook Change Dispatcher
 ******************************************************************************/

const processChange = async (

    notification

) => {

    try {

        if (!notification) {

            throw new Error(

                "Notification payload missing."

            );

        }

        log(

            "Incoming Change",

            {

                subscriptionId:

                    notification.subscriptionId,

                changeType:

                    notification.changeType,

                resource:

                    notification.resource,

            }

        );

        switch (

            notification.changeType

        ) {

            case CHANGE_TYPES.CREATED:

                return await processCreatedEmail(

                    notification

                );

            case CHANGE_TYPES.UPDATED:

                return await processUpdatedEmail(

                    notification

                );

            case CHANGE_TYPES.DELETED:

                return await processDeletedEmail(

                    notification

                );

            default:

                throw new Error(

                    `Unsupported change type: ${notification.changeType}`

                );

        }

    }

    catch (error) {

        console.error(

            "[Change Processor]",

            error.message

        );

        return failure(error);

    }

};


/******************************************************************************
 * Fetch Latest Email From Microsoft Graph
 ******************************************************************************/

const fetchGraphEmail = async (

    messageId

) => {

    try {

        const email =

            await graphService.getMessage(

                messageId

            );

        return email;

    }

    catch (error) {

        console.error(

            "[Fetch Graph Email]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Find Existing Email
 ******************************************************************************/

const findExistingEmail = async (

    messageId

) => {

    return await Email.findOne({

        messageId,

    });

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * processCreatedEmail()
 * Handle Newly Created Email
 ******************************************************************************/

const processCreatedEmail = async (

    notification

) => {

    try {

        const messageId =

            notification.resourceData?.id;

        if (!messageId) {

            throw new Error(

                "Message Id missing."

            );

        }

        /* ------------------------------------------------------------
           Fetch Latest Email From Microsoft Graph
        ------------------------------------------------------------ */

        const graphEmail =

            await fetchGraphEmail(

                messageId

            );

        if (!graphEmail) {

            throw new Error(

                "Unable to fetch email from Graph."

            );

        }

        /* ------------------------------------------------------------
           Prevent Duplicate Emails
        ------------------------------------------------------------ */

        const existingEmail =

            await findExistingEmail(

                messageId

            );

        if (existingEmail) {

            log(

                "Duplicate Email Ignored",

                {

                    messageId,

                }

            );

            return success(

                existingEmail,

                "Email already exists."

            );

        }

        /* ------------------------------------------------------------
           Save Email
        ------------------------------------------------------------ */

        const email =

            await Email.create({

                messageId:

                    graphEmail.id,

                subject:

                    graphEmail.subject,

                from:

                    graphEmail.from,

                sender:

                    graphEmail.sender,

                bodyPreview:

                    graphEmail.bodyPreview,

                conversationId:

                    graphEmail.conversationId,

                receivedDateTime:

                    graphEmail.receivedDateTime,

                importance:

                    graphEmail.importance,

                isRead:

                    graphEmail.isRead,

                hasAttachments:

                    graphEmail.hasAttachments,

                webLink:

                    graphEmail.webLink,

            });

        /* ------------------------------------------------------------
           AI Analysis
        ------------------------------------------------------------ */

        const aiResult =

            await aiAnalyzer.analyzeEmail(

                email

            );

        /* ------------------------------------------------------------
           Notifications
        ------------------------------------------------------------ */

        await notificationEngine.createNotification({

            userId:

                email.userId,

            title:

                "New Email Received",

            message:

                email.subject,

            type:

                "email",

            priority:

                aiResult?.priority ||

                "Medium",

            metadata: {

                emailId:

                    email._id,

            },

        });

        /* ------------------------------------------------------------
           Socket.IO Event
        ------------------------------------------------------------ */

        await notificationEvents.onNewEmailReceived(

            email

        );

        return success(

            {

                email,

                aiResult,

            },

            "New email processed successfully."

        );

    }

    catch (error) {

        console.error(

            "[Created Email]",

            error.message

        );

        return failure(error);

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * processUpdatedEmail()
 * Handle Updated Email
 ******************************************************************************/

const processUpdatedEmail = async (

    notification

) => {

    try {

        const messageId =

            notification.resourceData?.id;

        if (!messageId) {

            throw new Error(

                "Message Id missing."

            );

        }

        /* ------------------------------------------------------------
           Fetch Latest Email
        ------------------------------------------------------------ */

        const graphEmail =

            await fetchGraphEmail(

                messageId

            );

        if (!graphEmail) {

            throw new Error(

                "Unable to fetch updated email."

            );

        }

        /* ------------------------------------------------------------
           Find Existing Email
        ------------------------------------------------------------ */

        const email =

            await findExistingEmail(

                messageId

            );

        if (!email) {

            return processCreatedEmail(

                notification

            );

        }

        /* ------------------------------------------------------------
           Update Email
        ------------------------------------------------------------ */

        email.subject =

            graphEmail.subject;

        email.from =

            graphEmail.from;

        email.sender =

            graphEmail.sender;

        email.bodyPreview =

            graphEmail.bodyPreview;

        email.isRead =

            graphEmail.isRead;

        email.importance =

            graphEmail.importance;

        email.receivedDateTime =

            graphEmail.receivedDateTime;

        email.hasAttachments =

            graphEmail.hasAttachments;

        email.webLink =

            graphEmail.webLink;

        email.updatedAt =

            new Date();

        await email.save();

        /* ------------------------------------------------------------
           Re-run AI Analysis
        ------------------------------------------------------------ */

        const aiResult =

            await aiAnalyzer.analyzeEmail(

                email

            );

        /* ------------------------------------------------------------
           Dashboard Refresh
        ------------------------------------------------------------ */

        await dashboardService.refreshDashboard(

            email.userId

        );

        /* ------------------------------------------------------------
           Analytics Refresh
        ------------------------------------------------------------ */

        await analyticsService.refreshAnalytics(

            email.userId

        );

        /* ------------------------------------------------------------
           Socket Events
        ------------------------------------------------------------ */

        await notificationEvents.onEmailUpdated(

            email

        );

        await notificationEvents.onAIAnalysisCompleted(

            email,

            aiResult

        );

        return success(

            {

                email,

                aiResult,

            },

            "Updated email processed successfully."

        );

    }

    catch (error) {

        console.error(

            "[Updated Email]",

            error.message

        );

        return failure(error);

    }

};


/******************************************************************************
 * processDeletedEmail()
 * Handle Deleted Email
 ******************************************************************************/

const processDeletedEmail = async (

    notification

) => {

    try {

        const messageId =

            notification.resourceData?.id;

        if (!messageId) {

            throw new Error(

                "Message Id missing."

            );

        }

        const email =

            await findExistingEmail(

                messageId

            );

        if (!email) {

            return success(

                {},

                "Email already removed."

            );

        }

        await Email.deleteOne({

            _id: email._id,

        });

        await notificationEvents.onEmailDeleted(

            email

        );

        await dashboardService.refreshDashboard(

            email.userId

        );

        await analyticsService.refreshAnalytics(

            email.userId

        );

        return success(

            {

                messageId,

            },

            "Deleted email processed successfully."

        );

    }

    catch (error) {

        console.error(

            "[Deleted Email]",

            error.message

        );

        return failure(error);

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Refresh Enterprise Modules
 ******************************************************************************/

const refreshEnterpriseModules = async (

    userId

) => {

    try {

        await Promise.all([

            dashboardService.refreshDashboard(

                userId

            ),

            analyticsService.refreshAnalytics(

                userId

            ),

        ]);

        return true;

    }

    catch (error) {

        console.error(

            "[Refresh Modules]",

            error.message

        );

        return false;

    }

};


/******************************************************************************
 * Reprocess Existing Email
 ******************************************************************************/

const reprocessEmail = async (

    messageId

) => {

    try {

        const email =

            await findExistingEmail(

                messageId

            );

        if (!email) {

            throw new Error(

                "Email not found."

            );

        }

        const aiResult =

            await aiAnalyzer.analyzeEmail(

                email

            );

        await notificationEvents.onAIAnalysisCompleted(

            email,

            aiResult

        );

        await refreshEnterpriseModules(

            email.userId

        );

        return success(

            {

                email,

                aiResult,

            },

            "Email reprocessed successfully."

        );

    }

    catch (error) {

        return failure(error);

    }

};


/******************************************************************************
 * Process Batch Notifications
 ******************************************************************************/

const processBatch = async (

    notifications = []

) => {

    const results = [];

    for (const notification of notifications) {

        const result =

            await processChange(

                notification

            );

        results.push(result);

    }

    return success(

        {

            processed:

                results.length,

            results,

        },

        "Batch processed successfully."

    );

};


/******************************************************************************
 * Health Check
 ******************************************************************************/

const processorHealth = async () => {

    try {

        return success(

            {

                service:

                    "Outlook Change Processor",

                status:

                    "Healthy",

                checkedAt:

                    new Date().toISOString(),

            },

            "Processor healthy."

        );

    }

    catch (error) {

        return failure(error);

    }

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    processChange,

    processCreatedEmail,

    processUpdatedEmail,

    processDeletedEmail,

    reprocessEmail,

    processBatch,

    processorHealth,

};

/******************************************************************************
 * End outlookChangeProcessor.js
 ******************************************************************************/
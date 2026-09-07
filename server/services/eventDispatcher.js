/******************************************************************************
 * services/eventDispatcher.js
 * Part 1
 * Imports + Event Registry + Helpers
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const EventEmitter = require("events");

const notificationEvents =
    require("../socket/notificationEvents");

const outlookChangeProcessor =
    require("./outlookChangeProcessor");

const notificationEngine =
    require("./notificationEngine");

const dashboardService =
    require("./dashboardService");

const analyticsService =
    require("./analyticsService");

/* ==========================================================================
   Event Dispatcher
========================================================================== */

class EventDispatcher extends EventEmitter {}

const dispatcher = new EventDispatcher();

dispatcher.setMaxListeners(100);

/* ==========================================================================
   Event Types
========================================================================== */

const EVENTS = {

    EMAIL_CREATED:
        "email.created",

    EMAIL_UPDATED:
        "email.updated",

    EMAIL_DELETED:
        "email.deleted",

    AI_ANALYZED:
        "ai.analyzed",

    AI_REPLY:
        "ai.reply",

    TASK_CREATED:
        "task.created",

    TASK_UPDATED:
        "task.updated",

    DASHBOARD_REFRESH:
        "dashboard.refresh",

    NOTIFICATION_CREATED:
        "notification.created",

    COMPANY_UPDATED:
        "company.updated",

    SLA_BREACH:
        "sla.breach",

};

/* ==========================================================================
   Logger
========================================================================== */

const log = (

    event,

    payload = {}

) => {

    console.log(

        `[Event Dispatcher] ${event}`,

        payload

    );

};

const errorLog = (

    event,

    error

) => {

    console.error(

        `[Event Dispatcher] ${event}`,

        error?.message || error

    );

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Register Enterprise Event Listeners
 ******************************************************************************/

const registerEvents = () => {

    /*
     * Email Created
     */

    dispatcher.on(

        EVENTS.EMAIL_CREATED,

        async (email) => {

            try {

                log(

                    EVENTS.EMAIL_CREATED,

                    {

                        emailId: email._id,

                    }

                );

                await notificationEvents.onNewEmailReceived(

                    email

                );

                await dashboardService.refreshDashboard(

                    email.userId

                );

                await analyticsService.refreshAnalytics(

                    email.userId

                );

            }

            catch (error) {

                errorLog(

                    EVENTS.EMAIL_CREATED,

                    error

                );

            }

        }

    );

    /*
     * Email Updated
     */

    dispatcher.on(

        EVENTS.EMAIL_UPDATED,

        async (email) => {

            try {

                log(

                    EVENTS.EMAIL_UPDATED,

                    {

                        emailId: email._id,

                    }

                );

                await notificationEvents.onEmailUpdated(

                    email

                );

                await dashboardService.refreshDashboard(

                    email.userId

                );

            }

            catch (error) {

                errorLog(

                    EVENTS.EMAIL_UPDATED,

                    error

                );

            }

        }

    );

    /*
     * Email Deleted
     */

    dispatcher.on(

        EVENTS.EMAIL_DELETED,

        async (email) => {

            try {

                log(

                    EVENTS.EMAIL_DELETED,

                    {

                        emailId: email._id,

                    }

                );

                await notificationEvents.onEmailDeleted(

                    email

                );

                await dashboardService.refreshDashboard(

                    email.userId

                );

            }

            catch (error) {

                errorLog(

                    EVENTS.EMAIL_DELETED,

                    error

                );

            }

        }

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Register AI Event Listeners
 ******************************************************************************/

dispatcher.on(

    EVENTS.AI_ANALYZED,

    async ({ email, aiResult }) => {

        try {

            log(EVENTS.AI_ANALYZED, {

                emailId: email._id,

            });

            await notificationEvents.onAIAnalysisCompleted(

                email,

                aiResult

            );

            await dashboardService.refreshDashboard(

                email.userId

            );

            await analyticsService.refreshAnalytics(

                email.userId

            );

        }

        catch (error) {

            errorLog(EVENTS.AI_ANALYZED, error);

        }

    }

);


/******************************************************************************
 * AI Reply Generated
 ******************************************************************************/

dispatcher.on(

    EVENTS.AI_REPLY,

    async ({ email, reply }) => {

        try {

            log(EVENTS.AI_REPLY, {

                emailId: email._id,

            });

            await notificationEvents.onAIReplyGenerated(

                email,

                reply

            );

        }

        catch (error) {

            errorLog(EVENTS.AI_REPLY, error);

        }

    }

);


/******************************************************************************
 * Notification Created
 ******************************************************************************/

dispatcher.on(

    EVENTS.NOTIFICATION_CREATED,

    async (notification) => {

        try {

            log(EVENTS.NOTIFICATION_CREATED, {

                id: notification._id,

            });

            await notificationEngine.broadcastNotification(

                notification

            );

        }

        catch (error) {

            errorLog(

                EVENTS.NOTIFICATION_CREATED,

                error

            );

        }

    }

);

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Register Task Events
 ******************************************************************************/

dispatcher.on(

    EVENTS.TASK_CREATED,

    async (task) => {

        try {

            log(EVENTS.TASK_CREATED, {

                taskId: task._id,

            });

            await notificationEvents.onTaskCreated(

                task

            );

            await dashboardService.refreshDashboard(

                task.userId

            );

        }

        catch (error) {

            errorLog(

                EVENTS.TASK_CREATED,

                error

            );

        }

    }

);


/******************************************************************************
 * Task Updated
 ******************************************************************************/

dispatcher.on(

    EVENTS.TASK_UPDATED,

    async (task) => {

        try {

            log(EVENTS.TASK_UPDATED, {

                taskId: task._id,

            });

            await notificationEvents.onTaskUpdated(

                task

            );

            await dashboardService.refreshDashboard(

                task.userId

            );

        }

        catch (error) {

            errorLog(

                EVENTS.TASK_UPDATED,

                error

            );

        }

    }

);


/******************************************************************************
 * Dashboard Refresh
 ******************************************************************************/

dispatcher.on(

    EVENTS.DASHBOARD_REFRESH,

    async (userId) => {

        try {

            log(EVENTS.DASHBOARD_REFRESH, {

                userId,

            });

            await dashboardService.refreshDashboard(

                userId

            );

            await analyticsService.refreshAnalytics(

                userId

            );

        }

        catch (error) {

            errorLog(

                EVENTS.DASHBOARD_REFRESH,

                error

            );

        }

    }

);


/******************************************************************************
 * SLA Breach
 ******************************************************************************/

dispatcher.on(

    EVENTS.SLA_BREACH,

    async (email) => {

        try {

            log(EVENTS.SLA_BREACH, {

                emailId: email._id,

            });

            await notificationEvents.onSLABreach(

                email

            );

        }

        catch (error) {

            errorLog(

                EVENTS.SLA_BREACH,

                error

            );

        }

    }

);

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Emit Event
 ******************************************************************************/

const emit = (

    event,

    payload = {}

) => {

    try {

        log(event, payload);

        dispatcher.emit(

            event,

            payload

        );

        return true;

    }

    catch (error) {

        errorLog(event, error);

        return false;

    }

};


/******************************************************************************
 * Remove All Event Listeners
 ******************************************************************************/

const clearEvents = () => {

    dispatcher.removeAllListeners();

    log(

        "All Event Listeners Removed"

    );

};


/******************************************************************************
 * Dispatcher Health
 ******************************************************************************/

const dispatcherHealth = () => {

    return {

        success: true,

        service:

            "Enterprise Event Dispatcher",

        listeners:

            dispatcher.eventNames().length,

        registeredEvents:

            dispatcher.eventNames(),

        maxListeners:

            dispatcher.getMaxListeners(),

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Register Events Automatically
 ******************************************************************************/

registerEvents();


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    dispatcher,

    EVENTS,

    emit,

    registerEvents,

    clearEvents,

    dispatcherHealth,

};

/******************************************************************************
 * End eventDispatcher.js
 ******************************************************************************/
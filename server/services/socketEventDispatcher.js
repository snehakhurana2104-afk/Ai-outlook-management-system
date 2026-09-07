/******************************************************************************
 * services/socketEventDispatcher.js
 * Part 1
 * Enterprise Socket Event Dispatcher
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const { getIO } =
    require("../socket/socket");

const eventDispatcher =
    require("./eventDispatcher");

const webhookQueueService =
    require("./webhookQueueService");

const notificationEngine =
    require("./notificationEngine");

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

    TASK_CREATED:
        "task.created",

    TASK_UPDATED:
        "task.updated",

    DASHBOARD_REFRESH:
        "dashboard.refresh",

    NOTIFICATION_CREATED:
        "notification.created",

    SLA_BREACH:
        "sla.breach",

};

/* ==========================================================================
   Socket Emit Helper
========================================================================== */

const emit = (

    event,

    payload = {}

) => {

    try {

        const io = getIO();

        if (!io) return;

        io.emit(

            event,

            payload

        );

    }

    catch (error) {

        console.error(

            "[Socket Dispatcher]",

            error.message

        );

    }

};

/* ==========================================================================
   Logger
========================================================================== */

const log = (

    event,

    payload = {}

) => {

    console.log(

        `[Socket Dispatcher] ${event}`,

        payload

    );

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Register Enterprise Socket Events
 ******************************************************************************/

const registerSocketEvents = () => {

    /*
     * Email Created
     */

    eventDispatcher.dispatcher.on(

        eventDispatcher.EVENTS.EMAIL_CREATED,

        async (email) => {

            try {

                log(EVENTS.EMAIL_CREATED, {

                    emailId: email._id,

                });

                emit(

                    EVENTS.EMAIL_CREATED,

                    email

                );

            }

            catch (error) {

                console.error(

                    "[Socket Dispatcher]",

                    error.message

                );

            }

        }

    );

    /*
     * Email Updated
     */

    eventDispatcher.dispatcher.on(

        eventDispatcher.EVENTS.EMAIL_UPDATED,

        async (email) => {

            try {

                log(EVENTS.EMAIL_UPDATED, {

                    emailId: email._id,

                });

                emit(

                    EVENTS.EMAIL_UPDATED,

                    email

                );

            }

            catch (error) {

                console.error(

                    "[Socket Dispatcher]",

                    error.message

                );

            }

        }

    );

    /*
     * Email Deleted
     */

    eventDispatcher.dispatcher.on(

        eventDispatcher.EVENTS.EMAIL_DELETED,

        async (email) => {

            try {

                log(EVENTS.EMAIL_DELETED, {

                    emailId: email._id,

                });

                emit(

                    EVENTS.EMAIL_DELETED,

                    email

                );

            }

            catch (error) {

                console.error(

                    "[Socket Dispatcher]",

                    error.message

                );

            }

        }

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Register AI Events
 ******************************************************************************/

eventDispatcher.dispatcher.on(

    eventDispatcher.EVENTS.AI_ANALYZED,

    async ({ email, aiResult }) => {

        try {

            log(EVENTS.AI_ANALYZED, {

                emailId: email._id,

            });

            emit(

                EVENTS.AI_ANALYZED,

                {

                    email,

                    aiResult,

                }

            );

        }

        catch (error) {

            console.error(

                "[Socket Dispatcher]",

                error.message

            );

        }

    }

);


/******************************************************************************
 * Notification Created
 ******************************************************************************/

eventDispatcher.dispatcher.on(

    eventDispatcher.EVENTS.NOTIFICATION_CREATED,

    async (notification) => {

        try {

            log(EVENTS.NOTIFICATION_CREATED, {

                notificationId:

                    notification._id,

            });

            emit(

                EVENTS.NOTIFICATION_CREATED,

                notification

            );

        }

        catch (error) {

            console.error(

                "[Socket Dispatcher]",

                error.message

            );

        }

    }

);


/******************************************************************************
 * Queue Events
 ******************************************************************************/

webhookQueueService.queueEmitter.on(

    "job_completed",

    (job) => {

        emit(

            "queue.job.completed",

            job

        );

    }

);

webhookQueueService.queueEmitter.on(

    "job_failed",

    (job) => {

        emit(

            "queue.job.failed",

            job

        );

    }

);

webhookQueueService.queueEmitter.on(

    "job_retry",

    (job) => {

        emit(

            "queue.job.retry",

            job

        );

    }

);

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Register Task Events
 ******************************************************************************/

eventDispatcher.dispatcher.on(

    eventDispatcher.EVENTS.TASK_CREATED,

    async (task) => {

        try {

            log(EVENTS.TASK_CREATED, {

                taskId: task._id,

            });

            emit(

                EVENTS.TASK_CREATED,

                task

            );

        }

        catch (error) {

            console.error(

                "[Socket Dispatcher]",

                error.message

            );

        }

    }

);


eventDispatcher.dispatcher.on(

    eventDispatcher.EVENTS.TASK_UPDATED,

    async (task) => {

        try {

            log(EVENTS.TASK_UPDATED, {

                taskId: task._id,

            });

            emit(

                EVENTS.TASK_UPDATED,

                task

            );

        }

        catch (error) {

            console.error(

                "[Socket Dispatcher]",

                error.message

            );

        }

    }

);


/******************************************************************************
 * Dashboard Refresh Events
 ******************************************************************************/

eventDispatcher.dispatcher.on(

    eventDispatcher.EVENTS.DASHBOARD_REFRESH,

    async (dashboard) => {

        try {

            log(EVENTS.DASHBOARD_REFRESH);

            emit(

                EVENTS.DASHBOARD_REFRESH,

                dashboard

            );

        }

        catch (error) {

            console.error(

                "[Socket Dispatcher]",

                error.message

            );

        }

    }

);


/******************************************************************************
 * SLA Breach Events
 ******************************************************************************/

eventDispatcher.dispatcher.on(

    eventDispatcher.EVENTS.SLA_BREACH,

    async (email) => {

        try {

            log(EVENTS.SLA_BREACH, {

                emailId: email._id,

            });

            emit(

                EVENTS.SLA_BREACH,

                email

            );

        }

        catch (error) {

            console.error(

                "[Socket Dispatcher]",

                error.message

            );

        }

    }

);

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Register Connection Events
 ******************************************************************************/

const registerConnectionEvents = () => {

    try {

        const io = getIO();

        if (!io) {

            console.warn(

                "[Socket Dispatcher] Socket.IO not initialized."

            );

            return;

        }

        io.on(

            "connection",

            (socket) => {

                log(

                    "Client Connected",

                    {

                        socketId:

                            socket.id,

                    }

                );

                /*
                 * Client Ready
                 */

                socket.on(

                    "client.ready",

                    () => {

                        emit(

                            "server.ready",

                            {

                                socketId:

                                    socket.id,

                                connectedAt:

                                    new Date().toISOString(),

                            }

                        );

                    }

                );

                /*
                 * Join User Room
                 */

                socket.on(

                    "join.room",

                    (roomId) => {

                        socket.join(roomId);

                    }

                );

                /*
                 * Leave User Room
                 */

                socket.on(

                    "leave.room",

                    (roomId) => {

                        socket.leave(roomId);

                    }

                );

                /*
                 * Disconnect
                 */

                socket.on(

                    "disconnect",

                    () => {

                        log(

                            "Client Disconnected",

                            {

                                socketId:

                                    socket.id,

                            }

                        );

                    }

                );

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Dispatcher]",

            error.message

        );

    }

};


/******************************************************************************
 * Initialize Dispatcher
 ******************************************************************************/

const initializeSocketDispatcher = () => {

    registerSocketEvents();

    registerConnectionEvents();

    log(

        "Socket Event Dispatcher Initialized"

    );

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
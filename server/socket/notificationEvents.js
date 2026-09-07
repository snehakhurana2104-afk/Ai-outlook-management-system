/******************************************************************************
 * socket/notificationEvents.js
 * Part 1
 * Imports + Event Registration
 ******************************************************************************/

const { getIO } = require("../socket/socket");

const notificationEngine =
    require("../services/notificationEngine");

/* ==========================================================================
   Emit Notification To User
========================================================================== */

const emitNotification = async (

    userId,

    notification

) => {

    try {

        const io = getIO();

        io.to(userId.toString()).emit(

            "notification.created",

            notification

        );

    }

    catch (error) {

        console.error(

            "[Notification Socket]",

            error.message

        );

    }

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * New Email Events
 ******************************************************************************/

/* ==========================================================================
   New Email Received Event
========================================================================== */

const onNewEmailReceived = async (

    email

) => {

    try {

        if (!email) {

            return;

        }

        /* ------------------------------------------------------------
           Create Notification
        ------------------------------------------------------------ */

        const result =

            await notificationEngine.createNotification({

                userId: email.userId,

                title: "New Email Received",

                message:

                    `${email.from?.name || email.from} sent you a new email.`,

                type: "email",

                category: "inbox",

                priority:

                    email.priority || "Medium",

                metadata: {

                    emailId: email._id,

                    messageId: email.messageId,

                    subject: email.subject,

                    sender: email.from,

                },

            });

        if (!result.success) {

            return result;

        }

        /* ------------------------------------------------------------
           Broadcast Notification
        ------------------------------------------------------------ */

        await notificationEngine.broadcastNotification(

            result.notification

        );

        return {

            success: true,

            notification:

                result.notification,

        };

    }

    catch (error) {

        console.error(

            "[Socket Event] New Email",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * High Priority Email Event
 ******************************************************************************/

const onHighPriorityEmail = async (

    email

) => {

    try {

        if (!email) {

            return;

        }

        const result =

            await notificationEngine.createNotification({

                userId: email.userId,

                title: "High Priority Email",

                message:

                    `${email.subject}`,

                type: "email",

                category: "inbox",

                priority: "Critical",

                metadata: {

                    emailId: email._id,

                    messageId: email.messageId,

                },

            });

        if (!result.success) {

            return result;

        }

        await notificationEngine.broadcastNotification(

            result.notification

        );

        return {

            success: true,

            notification:

                result.notification,

        };

    }

    catch (error) {

        console.error(

            "[Socket Event] High Priority Email",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Email Deleted Event
 ******************************************************************************/

const onEmailDeleted = async (

    email

) => {

    try {

        if (!email) {

            return;

        }

        const io = getIO();

        io.to(email.userId.toString()).emit(

            "email.deleted",

            {

                success: true,

                emailId: email._id,

                messageId: email.messageId,

                timestamp: new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Email Deleted",

            error.message

        );

    }

};


/******************************************************************************
 * Email Updated Event
 ******************************************************************************/

const onEmailUpdated = async (

    email

) => {

    try {

        if (!email) {

            return;

        }

        const io = getIO();

        io.to(email.userId.toString()).emit(

            "email.updated",

            {

                success: true,

                email,

                timestamp: new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Email Updated",

            error.message

        );

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * AI Analysis Events
 ******************************************************************************/

/* ==========================================================================
   AI Analysis Completed
========================================================================== */

const onAIAnalysisCompleted = async (

    email,

    analysis

) => {

    try {

        if (!email || !analysis) {

            return;

        }

        const result =

            await notificationEngine.createAINotification({

                userId: email.userId,

                title: "AI Analysis Completed",

                message:

                    `AI finished analyzing "${email.subject}".`,

                priority:

                    analysis.priority ||

                    "Medium",

                metadata: {

                    emailId: email._id,

                    messageId: email.messageId,

                    sentiment:

                        analysis.sentiment,

                    category:

                        analysis.category,

                    confidence:

                        analysis.confidence,

                    summary:

                        analysis.summary,

                },

            });

        if (result?.success) {

            await notificationEngine.broadcastNotification(

                result.notification

            );

        }

        return result;

    }

    catch (error) {

        console.error(

            "[Socket Event] AI Analysis",

            error.message

        );

    }

};


/* ==========================================================================
   AI Reply Generated
========================================================================== */

const onAIReplyGenerated = async (

    email,

    reply

) => {

    try {

        if (!email) return;

        const notification =

            await notificationEngine.createNotification({

                userId: email.userId,

                title: "AI Reply Ready",

                message:

                    "AI generated a suggested reply.",

                type: "ai",

                category: "reply",

                priority: "Low",

                metadata: {

                    emailId: email._id,

                    reply,

                },

            });

        if (notification?.success) {

            await notificationEngine.broadcastNotification(

                notification.notification

            );

        }

    }

    catch (error) {

        console.error(

            "[Socket Event] AI Reply",

            error.message

        );

    }

};


/* ==========================================================================
   AI Priority Changed
========================================================================== */

const onAIPriorityDetected = async (

    email,

    priority

) => {

    try {

        if (!email) return;

        const notification =

            await notificationEngine.createNotification({

                userId: email.userId,

                title: "Priority Updated",

                message:

                    `AI classified this email as ${priority}.`,

                type: "ai",

                category: "priority",

                priority,

                metadata: {

                    emailId: email._id,

                    messageId:

                        email.messageId,

                },

            });

        if (notification?.success) {

            await notificationEngine.broadcastNotification(

                notification.notification

            );

        }

    }

    catch (error) {

        console.error(

            "[Socket Event] AI Priority",

            error.message

        );

    }

};


/* ==========================================================================
   AI SLA Warning
========================================================================== */

const onAISLAWarning = async (

    email,

    sla

) => {

    try {

        if (!email) return;

        const notification =

            await notificationEngine.createNotification({

                userId: email.userId,

                title: "SLA Warning",

                message:

                    `SLA expires in ${sla.remainingTime}.`,

                type: "sla",

                category: "warning",

                priority: "High",

                metadata: {

                    emailId: email._id,

                    sla,

                },

            });

        if (notification?.success) {

            await notificationEngine.broadcastNotification(

                notification.notification

            );

        }

    }

    catch (error) {

        console.error(

            "[Socket Event] SLA Warning",

            error.message

        );

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Task + Dashboard + SLA Events
 ******************************************************************************/

/* ==========================================================================
   Task Created Event
========================================================================== */

const onTaskCreated = async (

    task

) => {

    try {

        if (!task) return;

        const result =

            await notificationEngine.createNotification({

                userId: task.userId,

                title: "New Task Created",

                message:

                    `Task "${task.title}" has been created.`,

                type: "task",

                category: "task",

                priority:

                    task.priority || "Medium",

                metadata: {

                    taskId: task._id,

                    dueDate: task.dueDate,

                    status: task.status,

                },

            });

        if (result?.success) {

            await notificationEngine.broadcastNotification(

                result.notification

            );

        }

        return result;

    }

    catch (error) {

        console.error(

            "[Socket Event] Task Created",

            error.message

        );

    }

};


/* ==========================================================================
   Task Updated Event
========================================================================== */

const onTaskUpdated = async (

    task

) => {

    try {

        if (!task) return;

        const io = getIO();

        io.to(task.userId.toString()).emit(

            "task.updated",

            {

                success: true,

                task,

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Task Updated",

            error.message

        );

    }

};


/* ==========================================================================
   Dashboard Refresh Event
========================================================================== */

const onDashboardRefresh = async (

    userId,

    dashboardData

) => {

    try {

        const io = getIO();

        io.to(userId.toString()).emit(

            "dashboard.refresh",

            {

                success: true,

                dashboard:

                    dashboardData,

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Dashboard Refresh",

            error.message

        );

    }

};


/* ==========================================================================
   Dashboard KPI Updated
========================================================================== */

const onDashboardKPIUpdated = async (

    userId,

    kpis

) => {

    try {

        const io = getIO();

        io.to(userId.toString()).emit(

            "dashboard.kpi.updated",

            {

                success: true,

                kpis,

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] KPI Updated",

            error.message

        );

    }

};


/* ==========================================================================
   SLA Breach Event
========================================================================== */

const onSLABreach = async (

    email,

    sla

) => {

    try {

        if (!email) return;

        const result =

            await notificationEngine.createNotification({

                userId: email.userId,

                title: "SLA Breached",

                message:

                    `Email "${email.subject}" exceeded SLA.`,

                type: "sla",

                category: "critical",

                priority: "Critical",

                metadata: {

                    emailId: email._id,

                    messageId:

                        email.messageId,

                    sla,

                },

            });

        if (result?.success) {

            await notificationEngine.broadcastNotification(

                result.notification

            );

        }

    }

    catch (error) {

        console.error(

            "[Socket Event] SLA Breach",

            error.message

        );

    }

};


/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Company + System Events
 ******************************************************************************/

/* ==========================================================================
   Company Created Event
========================================================================== */

const onCompanyCreated = async (

    company

) => {

    try {

        if (!company) return;

        const notification =

            await notificationEngine.createNotification({

                userId: company.userId,

                title: "Company Added",

                message:

                    `${company.name} has been added successfully.`,

                type: "company",

                category: "company",

                priority: "Low",

                metadata: {

                    companyId: company._id,

                    companyName: company.name,

                },

            });

        if (notification?.success) {

            await notificationEngine.broadcastNotification(

                notification.notification

            );

        }

    }

    catch (error) {

        console.error(

            "[Socket Event] Company Created",

            error.message

        );

    }

};


/* ==========================================================================
   Company Updated Event
========================================================================== */

const onCompanyUpdated = async (

    company

) => {

    try {

        if (!company) return;

        const io = getIO();

        io.to(company.userId.toString()).emit(

            "company.updated",

            {

                success: true,

                company,

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Company Updated",

            error.message

        );

    }

};


/* ==========================================================================
   Company Deleted Event
========================================================================== */

const onCompanyDeleted = async (

    company

) => {

    try {

        if (!company) return;

        const io = getIO();

        io.to(company.userId.toString()).emit(

            "company.deleted",

            {

                success: true,

                companyId: company._id,

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Company Deleted",

            error.message

        );

    }

};


/******************************************************************************
 * System Notification Event
 ******************************************************************************/

const onSystemNotification = async (

    userId,

    title,

    message,

    priority = "Medium"

) => {

    try {

        const notification =

            await notificationEngine.createNotification({

                userId,

                title,

                message,

                type: "system",

                category: "system",

                priority,

            });

        if (notification?.success) {

            await notificationEngine.broadcastNotification(

                notification.notification

            );

        }

    }

    catch (error) {

        console.error(

            "[Socket Event] System Notification",

            error.message

        );

    }

};


/******************************************************************************
 * System Maintenance Event
 ******************************************************************************/

const onSystemMaintenance = async (

    maintenance

) => {

    try {

        const io = getIO();

        io.emit(

            "system.maintenance",

            {

                success: true,

                maintenance,

                timestamp:

                    new Date().toISOString(),

            }

        );

    }

    catch (error) {

        console.error(

            "[Socket Event] Maintenance",

            error.message

        );

    }

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    emitNotification,

    onNewEmailReceived,

    onHighPriorityEmail,

    onEmailDeleted,

    onEmailUpdated,

    onAIAnalysisCompleted,

    onAIReplyGenerated,

    onAIPriorityDetected,

    onAISLAWarning,

    onTaskCreated,

    onTaskUpdated,

    onDashboardRefresh,

    onDashboardKPIUpdated,

    onSLABreach,

    onCompanyCreated,

    onCompanyUpdated,

    onCompanyDeleted,

    onSystemNotification,

    onSystemMaintenance,

};

/******************************************************************************
 * End socket/notificationEvents.js
 ******************************************************************************/
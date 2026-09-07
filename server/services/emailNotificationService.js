/******************************************************************************
 * services/emailNotificationService.js
 * Part 1
 * Imports + Nodemailer Initialization + SMTP Configuration
 ******************************************************************************/

/* ==========================================================================
   Imports
========================================================================== */

const nodemailer = require("nodemailer");

/* ==========================================================================
   Environment Variables
========================================================================== */

const SMTP_HOST =
    process.env.SMTP_HOST || "smtp.gmail.com";

const SMTP_PORT =
    Number(process.env.SMTP_PORT || 587);

const SMTP_SECURE =
    process.env.SMTP_SECURE === "true";

const SMTP_USER =
    process.env.SMTP_USER;

const SMTP_PASS =
    process.env.SMTP_PASS;

const MAIL_FROM_NAME =
    process.env.MAIL_FROM_NAME ||
    "AI Outlook Email Intelligence";

const MAIL_FROM_EMAIL =
    process.env.MAIL_FROM_EMAIL ||
    SMTP_USER;

/* ==========================================================================
   SMTP Transport
========================================================================== */

const transporter = nodemailer.createTransport({

    host: SMTP_HOST,

    port: SMTP_PORT,

    secure: SMTP_SECURE,

    auth: {

        user: SMTP_USER,

        pass: SMTP_PASS,

    },

    pool: true,

    maxConnections: 5,

    maxMessages: 100,

});

/* ==========================================================================
   Default Mail Configuration
========================================================================== */

const DEFAULT_MAIL_OPTIONS = {

    from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>`,

};

/* ==========================================================================
   Helper
========================================================================== */

const now = () =>
    new Date().toISOString();

/******************************************************************************
 * Verify SMTP Connection
 ******************************************************************************/

const verifyTransport = async () => {

    try {

        await transporter.verify();

        console.log(
            "✅ SMTP Connection Established"
        );

        return true;

    }

    catch (error) {

        console.error(
            "[SMTP Error]",
            error.message
        );

        return false;

    }

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Enterprise HTML Email Templates
 ******************************************************************************/

/* ==========================================================================
   Escape HTML
========================================================================== */

const escapeHTML = (text = "") => {

    return String(text)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

};


/* ==========================================================================
   Base Email Layout
========================================================================== */

const baseTemplate = (

    title,

    content,

    footer = ""

) => {

    return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1.0">

<title>${escapeHTML(title)}</title>

<style>

body{

margin:0;
padding:0;
background:#f4f6f9;
font-family:Segoe UI,Arial,sans-serif;

}

.wrapper{

max-width:700px;
margin:auto;
background:#ffffff;
border-radius:10px;
overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,.08);

}

.header{

background:#2563eb;
padding:25px;
color:#fff;

}

.header h1{

margin:0;
font-size:24px;

}

.content{

padding:30px;
font-size:15px;
line-height:1.7;
color:#374151;

}

.card{

background:#f8fafc;
border-left:4px solid #2563eb;
padding:18px;
border-radius:6px;
margin-top:15px;

}

.footer{

background:#f3f4f6;
padding:20px;
font-size:12px;
text-align:center;
color:#6b7280;

}

.button{

display:inline-block;
background:#2563eb;
color:#ffffff !important;
padding:12px 22px;
border-radius:6px;
text-decoration:none;
font-weight:600;

}

.priority-high{

color:#dc2626;
font-weight:bold;

}

.priority-medium{

color:#d97706;
font-weight:bold;

}

.priority-low{

color:#16a34a;
font-weight:bold;

}

table{

width:100%;
border-collapse:collapse;

}

td{

padding:8px 0;

}

</style>

</head>

<body>

<div class="wrapper">

<div class="header">

<h1>${escapeHTML(title)}</h1>

</div>

<div class="content">

${content}

</div>

<div class="footer">

${footer}

<br><br>

AI Outlook Email Intelligence Platform

</div>

</div>

</body>

</html>

`;

};


/******************************************************************************
 * Notification Email Template
 ******************************************************************************/

const notificationTemplate = (notification) => {

    return baseTemplate(

        "New Notification",

        `

<p>Hello,</p>

<p>You have received a new notification.</p>

<div class="card">

<table>

<tr>

<td><strong>Title</strong></td>

<td>${escapeHTML(notification.title)}</td>

</tr>

<tr>

<td><strong>Type</strong></td>

<td>${escapeHTML(notification.type)}</td>

</tr>

<tr>

<td><strong>Priority</strong></td>

<td class="priority-${String(notification.priority).toLowerCase()}">

${escapeHTML(notification.priority)}

</td>

</tr>

<tr>

<td><strong>Message</strong></td>

<td>${escapeHTML(notification.message)}</td>

</tr>

</table>

</div>

<br>

<a class="button"

href="${process.env.CLIENT_URL || "http://localhost:3000"}">

Open Dashboard

</a>

`

    );

};


/******************************************************************************
 * AI Alert Template
 ******************************************************************************/

const aiAlertTemplate = (analysis) => {

    return baseTemplate(

        "AI Email Analysis",

        `

<p>An AI analysis has been completed.</p>

<div class="card">

<table>

<tr>

<td><strong>Priority</strong></td>

<td>${escapeHTML(analysis.priority)}</td>

</tr>

<tr>

<td><strong>Category</strong></td>

<td>${escapeHTML(analysis.category)}</td>

</tr>

<tr>

<td><strong>Sentiment</strong></td>

<td>${escapeHTML(analysis.sentiment)}</td>

</tr>

<tr>

<td><strong>Summary</strong></td>

<td>${escapeHTML(analysis.summary)}</td>

</tr>

</table>

</div>

`

    );

};


/******************************************************************************
 * SLA Warning Template
 ******************************************************************************/

const slaTemplate = (data) => {

    return baseTemplate(

        "SLA Warning",

        `

<p>An email is approaching its SLA deadline.</p>

<div class="card">

<table>

<tr>

<td><strong>Company</strong></td>

<td>${escapeHTML(data.company)}</td>

</tr>

<tr>

<td><strong>Subject</strong></td>

<td>${escapeHTML(data.subject)}</td>

</tr>

<tr>

<td><strong>Remaining Time</strong></td>

<td>${escapeHTML(data.remaining)}</td>

</tr>

</table>

</div>

`

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Send Notification Email
 ******************************************************************************/

const sendNotificationEmail = async (

    options = {}

) => {

    try {

        const {

            to,

            subject = "Notification",

            notification,

        } = options;

        if (!to) {

            throw new Error(

                "Recipient email is required."

            );

        }

        if (!notification) {

            throw new Error(

                "Notification payload is required."

            );

        }

        const html =

            notificationTemplate(

                notification

            );

        const mailOptions = {

            ...DEFAULT_MAIL_OPTIONS,

            to,

            subject,

            html,

        };

        const info =

            await transporter.sendMail(

                mailOptions

            );

        console.log(

            "[Notification Email Sent]",

            info.messageId

        );

        return {

            success: true,

            messageId:

                info.messageId,

            accepted:

                info.accepted,

            rejected:

                info.rejected,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Send Notification Email]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Send AI Analysis Email
 ******************************************************************************/

const sendAIAnalysisEmail = async (

    options = {}

) => {

    try {

        const {

            to,

            subject =

                "AI Email Analysis Report",

            analysis,

        } = options;

        const html =

            aiAlertTemplate(

                analysis

            );

        const info =

            await transporter.sendMail({

                ...DEFAULT_MAIL_OPTIONS,

                to,

                subject,

                html,

            });

        return {

            success: true,

            messageId:

                info.messageId,

            accepted:

                info.accepted,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[AI Analysis Email]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Send SLA Warning Email
 ******************************************************************************/

const sendSLAWarningEmail = async (

    options = {}

) => {

    try {

        const {

            to,

            subject =

                "SLA Warning",

            sla,

        } = options;

        const html =

            slaTemplate(

                sla

            );

        const info =

            await transporter.sendMail({

                ...DEFAULT_MAIL_OPTIONS,

                to,

                subject,

                html,

            });

        return {

            success: true,

            messageId:

                info.messageId,

            accepted:

                info.accepted,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[SLA Warning Email]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Send Bulk Notification Emails
 ******************************************************************************/

const sendBulkNotificationEmails = async (

    recipients = [],

    notification = {},

    subject = "Enterprise Notification"

) => {

    try {

        const results = [];

        for (const email of recipients) {

            try {

                const result =

                    await sendNotificationEmail({

                        to: email,

                        subject,

                        notification,

                    });

                results.push({

                    email,

                    success: true,

                    messageId:

                        result.messageId,

                });

            }

            catch (error) {

                results.push({

                    email,

                    success: false,

                    error:

                        error.message,

                });

            }

        }

        return {

            success: true,

            total:

                recipients.length,

            delivered:

                results.filter(

                    x => x.success

                ).length,

            failed:

                results.filter(

                    x => !x.success

                ).length,

            results,

            timestamp: now(),

        };

    }

    catch (error) {

        console.error(

            "[Bulk Email Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Send High Priority Email
 ******************************************************************************/

const sendPriorityNotificationEmail = async (

    options = {}

) => {

    try {

        const {

            to,

            notification,

        } = options;

        const html =

            notificationTemplate(

                notification

            );

        const info =

            await transporter.sendMail({

                ...DEFAULT_MAIL_OPTIONS,

                to,

                subject:

                    "🚨 HIGH PRIORITY NOTIFICATION",

                priority: "high",

                headers: {

                    "X-Priority": "1",

                    Importance: "high",

                },

                html,

            });

        return {

            success: true,

            messageId:

                info.messageId,

            accepted:

                info.accepted,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[Priority Email Error]",

            error.message

        );

        throw error;

    }

};


/******************************************************************************
 * Send System Email
 ******************************************************************************/

const sendSystemNotificationEmail = async (

    options = {}

) => {

    try {

        const {

            to,

            title,

            message,

        } = options;

        const html = baseTemplate(

            title,

            `<p>${message}</p>`

        );

        const info =

            await transporter.sendMail({

                ...DEFAULT_MAIL_OPTIONS,

                to,

                subject: title,

                html,

            });

        return {

            success: true,

            messageId:

                info.messageId,

            timestamp:

                now(),

        };

    }

    catch (error) {

        console.error(

            "[System Email Error]",

            error.message

        );

        throw error;

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Retry Email
 ******************************************************************************/

const retryEmail = async (

    mailOptions,

    retries = 3

) => {

    let attempt = 0;

    while (attempt < retries) {

        try {

            const info =

                await transporter.sendMail(

                    mailOptions

                );

            return {

                success: true,

                messageId:

                    info.messageId,

                attempts:

                    attempt + 1,

                timestamp:

                    now(),

            };

        }

        catch (error) {

            attempt++;

            console.warn(

                `[Email Retry ${attempt}]`,

                error.message

            );

            if (attempt >= retries) {

                return {

                    success: false,

                    attempts: attempt,

                    error:

                        error.message,

                };

            }

            await new Promise(

                (resolve) =>

                    setTimeout(

                        resolve,

                        attempt * 1000

                    )

            );

        }

    }

};


/******************************************************************************
 * Email Queue
 ******************************************************************************/

const emailQueue = [];


/******************************************************************************
 * Add Email To Queue
 ******************************************************************************/

const queueEmail = async (

    mailOptions

) => {

    emailQueue.push({

        ...mailOptions,

        queuedAt: now(),

    });

    return {

        success: true,

        queueSize:

            emailQueue.length,

    };

};


/******************************************************************************
 * Process Queue
 ******************************************************************************/

const processEmailQueue = async () => {

    while (

        emailQueue.length > 0

    ) {

        const mailOptions =

            emailQueue.shift();

        const result =

            await retryEmail(

                mailOptions

            );

        if (!result.success) {

            console.error(

                "[Email Queue Failed]",

                result.error

            );

        }

    }

    return {

        success: true,

        remaining:

            emailQueue.length,

        timestamp:

            now(),

    };

};


/******************************************************************************
 * Validate Email Address
 ******************************************************************************/

const validateEmail = (

    email

) => {

    const regex =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Email Notification Service Health
 ******************************************************************************/

const emailNotificationHealth = async () => {

    try {

        const smtpConnected =
            await verifyTransport();

        return {

            success: smtpConnected,

            service:
                "Email Notification Service",

            status:
                smtpConnected
                    ? "healthy"
                    : "unhealthy",

            smtp: {

                host: SMTP_HOST,

                port: SMTP_PORT,

                secure: SMTP_SECURE,

                connected:
                    smtpConnected,

            },

            queue: {

                pending:
                    emailQueue.length,

            },

            timestamp:
                now(),

        };

    }

    catch (error) {

        console.error(

            "[Email Health]",

            error.message

        );

        return {

            success: false,

            status: "unhealthy",

            error:
                error.message,

            timestamp:
                now(),

        };

    }

};


/******************************************************************************
 * Get Queue Status
 ******************************************************************************/

const getEmailQueueStatus = () => {

    return {

        success: true,

        pending:

            emailQueue.length,

        queue:

            emailQueue,

        timestamp:

            now(),

    };

};


/******************************************************************************
 * Clear Queue
 ******************************************************************************/

const clearEmailQueue = () => {

    emailQueue.length = 0;

    return {

        success: true,

        pending: 0,

        timestamp:

            now(),

    };

};


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    verifyTransport,

    sendNotificationEmail,

    sendAIAnalysisEmail,

    sendSLAWarningEmail,

    sendBulkNotificationEmails,

    sendPriorityNotificationEmail,

    sendSystemNotificationEmail,

    retryEmail,

    queueEmail,

    processEmailQueue,

    validateEmail,

    emailNotificationHealth,

    getEmailQueueStatus,

    clearEmailQueue,

};

/******************************************************************************
 * End services/emailNotificationService.js
 ******************************************************************************/
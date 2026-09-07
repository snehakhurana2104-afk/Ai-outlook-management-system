/******************************************************************************
 * services/notificationAuditService.js
 * Part 1
 * Imports + Configuration + Audit Store + Logger
 ******************************************************************************/

/* ==========================================================================
   Configuration
========================================================================== */

const MAX_AUDIT_RECORDS =
    Number(process.env.NOTIFICATION_AUDIT_LIMIT || 10000);

const AUDIT_RETENTION_DAYS =
    Number(process.env.NOTIFICATION_AUDIT_RETENTION || 90);

const CLEANUP_INTERVAL =
    Number(
        process.env.NOTIFICATION_AUDIT_CLEANUP_INTERVAL ||
        60 * 60 * 1000
    );

/* ==========================================================================
   In-Memory Audit Store
   (Replace with MongoDB in Production)
========================================================================== */

const auditLogs = [];

/* ==========================================================================
   Statistics
========================================================================== */

let totalAudits = 0;

let deletedAudits = 0;

let cleanedAudits = 0;

/* ==========================================================================
   Audit Types
========================================================================== */

const AUDIT_TYPES = {

    EMAIL: "EMAIL",

    PUSH: "PUSH",

    BROWSER: "BROWSER",

    SMS: "SMS",

    SYSTEM: "SYSTEM",

};

/* ==========================================================================
   Audit Status
========================================================================== */

const AUDIT_STATUS = {

    SUCCESS: "SUCCESS",

    FAILED: "FAILED",

    RETRY: "RETRY",

    PENDING: "PENDING",

};

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, payload = {}) => {

    console.log(

        `[Notification Audit] ${message}`,

        payload

    );

};

const errorLog = (message, error) => {

    console.error(

        `[Notification Audit] ${message}`,

        error?.message || error

    );

};

/* ==========================================================================
   Audit Record Factory
========================================================================== */

const createAuditRecord = ({

    userId,

    notificationId,

    type,

    status,

    channel,

    message,

    metadata = {},

}) => ({

    id:
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}`,

    userId,

    notificationId,

    type,

    status,

    channel,

    message,

    metadata,

    createdAt:
        new Date(),

});

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Save Audit Record
 ******************************************************************************/

const saveAudit = async (auditData) => {

    try {

        if (

            auditLogs.length >=

            MAX_AUDIT_RECORDS

        ) {

            throw new Error(

                "Audit storage limit reached."

            );

        }

        const audit =

            createAuditRecord(auditData);

        auditLogs.push(audit);

        totalAudits++;

        log(

            "Audit Record Saved",

            {

                auditId: audit.id,

                userId: audit.userId,

                type: audit.type,

                status: audit.status,

            }

        );

        return audit;

    }

    catch (error) {

        errorLog(

            "Save Audit Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Get Audit By Id
 ******************************************************************************/

const getAuditById = (auditId) => {

    return (

        auditLogs.find(

            audit => audit.id === auditId

        ) || null

    );

};


/******************************************************************************
 * Get All Audits
 ******************************************************************************/

const getAllAudits = () => {

    return auditLogs;

};


/******************************************************************************
 * Check Audit Exists
 ******************************************************************************/

const auditExists = (auditId) => {

    return auditLogs.some(

        audit => audit.id === auditId

    );

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Get Audits By User
 ******************************************************************************/

const getAuditsByUser = (userId) => {

    return auditLogs.filter(

        audit => audit.userId === userId

    );

};


/******************************************************************************
 * Search Audit Logs
 ******************************************************************************/

const searchAudits = (keyword = "") => {

    const search = keyword.toLowerCase();

    return auditLogs.filter(audit =>

        (audit.message || "")
            .toLowerCase()
            .includes(search) ||

        (audit.type || "")
            .toLowerCase()
            .includes(search) ||

        (audit.status || "")
            .toLowerCase()
            .includes(search) ||

        (audit.channel || "")
            .toLowerCase()
            .includes(search)

    );

};


/******************************************************************************
 * Filter Audit Logs
 ******************************************************************************/

const filterAudits = ({

    type,

    status,

    channel,

} = {}) => {

    return auditLogs.filter(audit => {

        if (type && audit.type !== type) {

            return false;

        }

        if (status && audit.status !== status) {

            return false;

        }

        if (channel && audit.channel !== channel) {

            return false;

        }

        return true;

    });

};


/******************************************************************************
 * Get Recent Audits
 ******************************************************************************/

const getRecentAudits = (limit = 20) => {

    return [...auditLogs]

        .sort(

            (a, b) =>

                new Date(b.createdAt) -

                new Date(a.createdAt)

        )

        .slice(0, limit);

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Delete Audit By Id
 ******************************************************************************/

const deleteAudit = (auditId) => {

    try {

        const index = auditLogs.findIndex(

            audit => audit.id === auditId

        );

        if (index === -1) {

            throw new Error(

                "Audit record not found."

            );

        }

        const deletedAudit =

            auditLogs.splice(index, 1)[0];

        deletedAudits++;

        log(

            "Audit Deleted",

            {

                auditId: deletedAudit.id,

            }

        );

        return {

            success: true,

            deletedAudit,

        };

    }

    catch (error) {

        errorLog(

            "Delete Audit",

            error

        );

        return {

            success: false,

            message: error.message,

        };

    }

};


/******************************************************************************
 * Clear All Audit Logs
 ******************************************************************************/

const clearAuditLogs = () => {

    try {

        const count = auditLogs.length;

        auditLogs.length = 0;

        deletedAudits += count;

        log(

            "Audit Logs Cleared",

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

            "Clear Audit Logs",

            error

        );

        return {

            success: false,

            message: error.message,

        };

    }

};


/******************************************************************************
 * Cleanup Expired Audit Logs
 ******************************************************************************/

const cleanupExpiredAudits = () => {

    try {

        const now = new Date();

        const before = auditLogs.length;

        const validAudits = auditLogs.filter(audit => {

            const ageInDays =

                (now - new Date(audit.createdAt)) /

                (1000 * 60 * 60 * 24);

            return ageInDays < AUDIT_RETENTION_DAYS;

        });

        cleanedAudits +=

            before - validAudits.length;

        auditLogs.length = 0;

        auditLogs.push(...validAudits);

        log(

            "Expired Audit Logs Cleaned",

            {

                removed:

                    before - validAudits.length,

            }

        );

        return {

            success: true,

            removed:

                before - validAudits.length,

        };

    }

    catch (error) {

        errorLog(

            "Cleanup Audits",

            error

        );

        return {

            success: false,

            message: error.message,

        };

    }

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Audit Statistics
 ******************************************************************************/

const getAuditStats = () => {

    return {

        success: true,

        totalAudits,

        activeAudits:

            auditLogs.length,

        deletedAudits,

        cleanedAudits,

        retentionDays:

            AUDIT_RETENTION_DAYS,

        maxRecords:

            MAX_AUDIT_RECORDS,

        timestamp:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Audit Health
 ******************************************************************************/

const auditHealth = () => {

    return {

        success: true,

        service:

            "Notification Audit Service",

        status:

            auditLogs.length < MAX_AUDIT_RECORDS

                ? "Healthy"

                : "Full",

        totalAudits,

        activeAudits:

            auditLogs.length,

        storageLimit:

            MAX_AUDIT_RECORDS,

        checkedAt:

            new Date().toISOString(),

    };

};


/******************************************************************************
 * Monitor Audit Service
 ******************************************************************************/

const monitorAuditService = () => {

    log(

        "Audit Monitor",

        {

            totalAudits,

            activeAudits:

                auditLogs.length,

            deletedAudits,

            cleanedAudits,

        }

    );

};


/******************************************************************************
 * Auto Monitor
 ******************************************************************************/

setInterval(

    monitorAuditService,

    60000

);

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Initialize Notification Audit Service
 ******************************************************************************/

const initializeAuditService = () => {

    try {

        log(

            "Initializing Notification Audit Service..."

        );

        /*
         * Auto Cleanup Scheduler
         */

        setInterval(

            () => {

                cleanupExpiredAudits();

            },

            CLEANUP_INTERVAL

        );

        log(

            "Notification Audit Service Initialized"

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
 * Shutdown Notification Audit Service
 ******************************************************************************/

const shutdownAuditService = () => {

    try {

        log(

            "Notification Audit Service Shutdown"

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
 * Auto Initialize
 ******************************************************************************/

if (

    process.env.NODE_ENV === "production"

) {

    initializeAuditService();

}


/******************************************************************************
 * Graceful Shutdown
 ******************************************************************************/

process.on(

    "SIGINT",

    () => {

        shutdownAuditService();

        process.exit(0);

    }

);

process.on(

    "SIGTERM",

    () => {

        shutdownAuditService();

        process.exit(0);

    }

);


/******************************************************************************
 * Exports
 ******************************************************************************/

module.exports = {

    AUDIT_TYPES,

    AUDIT_STATUS,

    saveAudit,

    getAuditById,

    getAllAudits,

    auditExists,

    getAuditsByUser,

    searchAudits,

    filterAudits,

    getRecentAudits,

    deleteAudit,

    clearAuditLogs,

    cleanupExpiredAudits,

    getAuditStats,

    auditHealth,

    monitorAuditService,

    initializeAuditService,

    shutdownAuditService,

};


/******************************************************************************
 * End notificationAuditService.js
 ******************************************************************************/
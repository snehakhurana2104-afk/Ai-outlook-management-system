/******************************************************************************
 * services/aiEngineService.js
 * Part 1
 * Imports + Helpers
 ******************************************************************************/

/* ==========================================================================
   OpenAI Service
========================================================================== */

const openaiService = require("./openaiService");

/* ==========================================================================
   Constants
========================================================================== */

const DEFAULT_CONFIDENCE = 80;

const DEFAULT_SCORE = 50;

/* ==========================================================================
   Safe JSON Helper
========================================================================== */

const safeObject = (value = {}) => {

    if (!value || typeof value !== "object") {

        return {};

    }

    return value;

};

/* ==========================================================================
   Safe Array Helper
========================================================================== */

const safeArray = (value) => {

    if (!Array.isArray(value)) {

        return [];

    }

    return value;

};

/* ==========================================================================
   Number Helper
========================================================================== */

const safeNumber = (

    value,

    defaultValue = 0

) => {

    const number = Number(value);

    if (Number.isNaN(number)) {

        return defaultValue;

    }

    return number;

};

/* ==========================================================================
   String Helper
========================================================================== */

const safeString = (

    value,

    defaultValue = ""

) => {

    if (

        value === undefined ||

        value === null

    ) {

        return defaultValue;

    }

    return String(value).trim();

};

/* ==========================================================================
   Build Enterprise AI Response
========================================================================== */

const buildAIResponse = (

    analysis = {},

    priority = {},

    sentiment = {},

    summary = {}

) => {

    analysis = safeObject(analysis);

    priority = safeObject(priority);

    sentiment = safeObject(sentiment);

    summary = safeObject(summary);

    return {

        classification:

            safeString(

                analysis.classification,

                "Other"

            ),

        priority:

            safeString(

                priority.priority ||

                analysis.priority,

                "Medium"

            ),

        importanceScore:

            safeNumber(

                priority.importanceScore ||

                analysis.importanceScore,

                DEFAULT_SCORE

            ),

        urgency:

            safeString(

                priority.urgency ||

                analysis.urgency,

                "No Deadline"

            ),

        spam:

            Boolean(

                analysis.spam

            ),

        spamConfidence:

            safeNumber(

                analysis.spamConfidence,

                DEFAULT_CONFIDENCE

            ),

        sentiment:

            safeString(

                sentiment.sentiment ||

                analysis.sentiment,

                "Neutral"

            ),

        riskLevel:

            safeString(

                analysis.riskLevel,

                "Low"

            ),

        tags:

            safeArray(

                analysis.tags

            ),

        summary:

            safeString(

                summary.summary ||

                analysis.summary

            ),

        suggestedAction:

            safeString(

                analysis.suggestedAction

            ),

        confidence:

            safeNumber(

                analysis.confidence,

                DEFAULT_CONFIDENCE

            ),

    };

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * services/aiEngineService.js
 * Part 2
 * Single Email Analysis
 ******************************************************************************/

/* ==========================================================================
   Analyze Single Email
========================================================================== */

const analyzeSingleEmail = async (email = {}) => {

    try {

        if (!email) {

            throw new Error("Email data is required");

        }

        /**********************************************************************
         * Execute AI Tasks in Parallel
         **********************************************************************/

        const [

            analysis,

            priority,

            sentiment,

            summary,

        ] = await Promise.all([

            openaiService.analyzeEmail(email),

            openaiService.detectPriority(email),

            openaiService.detectSentiment(email),

            openaiService.summarizeEmail(email),

        ]);

        /**********************************************************************
         * Build Enterprise Response
         **********************************************************************/

        const aiResult = buildAIResponse(

            analysis,

            priority,

            sentiment,

            summary

        );

        /**********************************************************************
         * Add Metadata
         **********************************************************************/

        aiResult.emailId =

            email.id ||

            email._id ||

            null;

        aiResult.subject =

            safeString(email.subject);

        aiResult.from =

            safeString(

                email.from?.emailAddress?.address ||

                email.from

            );

        aiResult.receivedDateTime =

            email.receivedDateTime ||

            null;

        aiResult.processedAt =

            new Date();

        aiResult.success = true;

        return aiResult;

    }

    catch (error) {

        console.error(

            "[AI Engine Error]",

            error.message

        );

        return {

            success: false,

            emailId:

                email?.id ||

                email?._id ||

                null,

            error: error.message,

            processedAt: new Date(),

        };

    }

};

/******************************************************************************
 * Reanalyze Email
 ******************************************************************************/

const reAnalyzeEmail = async (email = {}) => {

    return await analyzeSingleEmail(email);

};

/******************************************************************************
 * Analyze Email Preview
 ******************************************************************************/

const analyzePreview = async (email = {}) => {

    const result =

        await analyzeSingleEmail(email);

    if (!result.success) {

        return result;

    }

    return {

        success: true,

        classification: result.classification,

        priority: result.priority,

        importanceScore: result.importanceScore,

        urgency: result.urgency,

        sentiment: result.sentiment,

        summary: result.summary,

        confidence: result.confidence,

    };

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************//******************************************************************************
 * services/aiEngineService.js
 * Part 3
 * Bulk Email Analysis
 ******************************************************************************/

/* ==========================================================================
   Analyze Multiple Emails
========================================================================== */

const analyzeBulkEmails = async (emails = []) => {

    try {

        if (!Array.isArray(emails)) {

            throw new Error("Emails must be an array");

        }

        if (emails.length === 0) {

            return {

                success: true,

                totalEmails: 0,

                processed: 0,

                failed: 0,

                results: [],

            };

        }

        const results = [];

        let processed = 0;

        let failed = 0;

        /**********************************************************************
         * Process Emails
         **********************************************************************/

        for (const email of emails) {

            const result =

                await analyzeSingleEmail(email);

            results.push(result);

            if (result.success) {

                processed++;

            }

            else {

                failed++;

            }

        }

        return {

            success: true,

            totalEmails: emails.length,

            processed,

            failed,

            results,

            completedAt: new Date(),

        };

    }

    catch (error) {

        console.error(

            "[Bulk Analysis Error]",

            error.message

        );

        return {

            success: false,

            message: error.message,

        };

    }

};

/* ==========================================================================
   Analyze Email IDs
========================================================================== */

const analyzeEmailIds = async (emailList = []) => {

    const results = [];

    for (const email of emailList) {

        const analysis =

            await analyzeSingleEmail(email);

        results.push({

            emailId:

                email.id ||

                email._id ||

                null,

            analysis,

        });

    }

    return results;

};

/* ==========================================================================
   Filter High Priority Emails
========================================================================== */

const getHighPriorityEmails = (results = []) => {

    return results.filter(

        (item) =>

            item.success &&

            (

                item.priority === "Critical" ||

                item.priority === "High"

            )

    );

};

/* ==========================================================================
   Filter Spam Emails
========================================================================== */

const getSpamEmails = (results = []) => {

    return results.filter(

        (item) =>

            item.success &&

            item.spam === true

    );

};

/* ==========================================================================
   Filter Risk Emails
========================================================================== */

const getRiskEmails = (results = []) => {

    return results.filter(

        (item) =>

            item.success &&

            item.riskLevel === "High"

    );

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * services/aiEngineService.js
 * Part 4
 * AI Statistics + Health + Dashboard Metrics
 ******************************************************************************/

/* ==========================================================================
   Build AI Statistics
========================================================================== */

const buildAIStatistics = (results = []) => {

    const stats = {

        total: results.length,

        processed: 0,

        failed: 0,

        critical: 0,

        high: 0,

        medium: 0,

        low: 0,

        spam: 0,

        risk: 0,

        positive: 0,

        neutral: 0,

        negative: 0,

        averageImportance: 0,

    };

    let totalImportance = 0;

    for (const item of results) {

        if (!item.success) {

            stats.failed++;

            continue;

        }

        stats.processed++;

        totalImportance += safeNumber(

            item.importanceScore

        );

        switch (item.priority) {

            case "Critical":

                stats.critical++;

                break;

            case "High":

                stats.high++;

                break;

            case "Medium":

                stats.medium++;

                break;

            case "Low":

                stats.low++;

                break;

        }

        if (item.spam) {

            stats.spam++;

        }

        if (item.riskLevel === "High") {

            stats.risk++;

        }

        switch (item.sentiment) {

            case "Positive":

                stats.positive++;

                break;

            case "Neutral":

                stats.neutral++;

                break;

            case "Negative":

            case "Angry":

                stats.negative++;

                break;

        }

    }

    stats.averageImportance =

        stats.processed === 0

            ? 0

            : Math.round(

                  totalImportance /

                  stats.processed

              );

    return stats;

};

/* ==========================================================================
   Dashboard Metrics
========================================================================== */

const buildDashboardMetrics = (results = []) => {

    const stats =

        buildAIStatistics(results);

    return {

        success: true,

        overview: {

            totalEmails: stats.total,

            analyzedEmails: stats.processed,

            failedEmails: stats.failed,

        },

        priority: {

            critical: stats.critical,

            high: stats.high,

            medium: stats.medium,

            low: stats.low,

        },

        security: {

            spam: stats.spam,

            risk: stats.risk,

        },

        sentiment: {

            positive: stats.positive,

            neutral: stats.neutral,

            negative: stats.negative,

        },

        averageImportance:

            stats.averageImportance,

        generatedAt:

            new Date(),

    };

};

/* ==========================================================================
   AI Health
========================================================================== */

const getAIHealth = async () => {

    const health =

        await openaiService.healthCheck();

    return {

        success: health.success,

        provider: health.provider,

        model: health.model,

        status:

            health.success

                ? "ONLINE"

                : "OFFLINE",

        checkedAt:

            new Date(),

        error:

            health.error || null,

    };

};

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * services/aiEngineService.js
 * Part 5
 * Final Utility Methods + Exports
 ******************************************************************************/

/* ==========================================================================
   AI Service Information
========================================================================== */

const getServiceInfo = () => {

    return {

        service: "AI Engine Service",

        version: "1.0.0",

        provider: "OpenAI",

        capabilities: [

            "Email Classification",

            "Priority Detection",

            "Importance Score",

            "Urgency Detection",

            "Spam Detection",

            "Sentiment Analysis",

            "Risk Detection",

            "AI Summary",

            "Suggested Action",

            "Bulk Analysis",

        ],

    };

};

/* ==========================================================================
   Validate Email Object
========================================================================== */

const validateEmail = (email = {}) => {

    return Boolean(

        email &&

        (

            email.subject ||

            email.body ||

            email.bodyPreview

        )

    );

};

/* ==========================================================================
   Filter Invalid Emails
========================================================================== */

const filterValidEmails = (emails = []) => {

    return emails.filter(validateEmail);

};

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    analyzeSingleEmail,

    reAnalyzeEmail,

    analyzePreview,

    analyzeBulkEmails,

    analyzeEmailIds,

    getHighPriorityEmails,

    getSpamEmails,

    getRiskEmails,

    buildAIStatistics,

    buildDashboardMetrics,

    getAIHealth,

    getServiceInfo,

    validateEmail,

    filterValidEmails,

};

/******************************************************************************
 * End services/aiEngineService.js
 ******************************************************************************/
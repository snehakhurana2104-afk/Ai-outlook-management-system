/******************************************************************************
 * controllers/aiController.js
 * Part 1
 * Imports + Existing Reply Methods
 ******************************************************************************/

/* ==========================================================================
   Models
========================================================================== */

const Email = require("../models/Email");

/* ==========================================================================
   Services
========================================================================== */

const aiEngineService = require("../services/aiEngineService");

const {

    generateReply,

} = require("../services/aiReplyService");

/******************************************************************************
 * Generate AI Reply
 ******************************************************************************/

const generateAIReply = async (req, res) => {

    try {

        const { emailId } = req.params;

        const email = await Email.findById(emailId);

        if (!email) {

            return res.status(404).json({

                success: false,

                message: "Email not found",

            });

        }

        const aiReply = await generateReply(email);

        return res.json({

            success: true,

            data: {

                aiReply,

            },

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Send Reply
 ******************************************************************************/

const sendReply = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Reply feature will be implemented in Step 15.",

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Reply All
 ******************************************************************************/

const replyAllEmail = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Reply All feature will be implemented in Step 15.",

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Forward Email
 ******************************************************************************/

const forwardEmail = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Forward feature will be implemented in Step 15.",

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Send New Mail
 ******************************************************************************/

const sendNewMail = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Send Mail feature will be implemented in Step 15.",

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Analyze Single Email
 ******************************************************************************/

const analyzeEmail = async (req, res) => {

    try {

        const { emailId } = req.params;

        const email = await Email.findById(emailId);

        if (!email) {

            return res.status(404).json({

                success: false,

                message: "Email not found",

            });

        }

        const result =
            await aiEngineService.analyzeSingleEmail(email);

        return res.status(200).json({

            success: true,

            message: "Email analyzed successfully",

            data: result,

        });

    }

    catch (error) {

        console.error(

            "[AI Analyze Error]",

            error.message

        );

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/******************************************************************************
 * Analyze Bulk Emails
 ******************************************************************************/

const analyzeBulkEmails = async (req, res) => {

    try {

        const emails = await Email.find({});

        const result =
            await aiEngineService.analyzeBulkEmails(emails);

        return res.status(200).json({

            success: true,

            data: result,

        });

    }

    catch (error) {

        console.error(

            "[Bulk AI Error]",

            error.message

        );

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/******************************************************************************
 * Reanalyze Email
 ******************************************************************************/

const reAnalyzeEmail = async (req, res) => {

    try {

        const { emailId } = req.params;

        const email = await Email.findById(emailId);

        if (!email) {

            return res.status(404).json({

                success: false,

                message: "Email not found",

            });

        }

        const result =
            await aiEngineService.reAnalyzeEmail(email);

        return res.status(200).json({

            success: true,

            data: result,

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/******************************************************************************
 * AI Preview
 ******************************************************************************/

const analyzePreview = async (req, res) => {

    try {

        const { emailId } = req.params;

        const email = await Email.findById(emailId);

        if (!email) {

            return res.status(404).json({

                success: false,

                message: "Email not found",

            });

        }

        const preview =
            await aiEngineService.analyzePreview(email);

        return res.status(200).json({

            success: true,

            data: preview,

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * AI Health
 ******************************************************************************/

const aiHealth = async (req, res) => {

    try {

        const health =
            await aiEngineService.getAIHealth();

        return res.status(200).json({

            success: true,

            data: health,

        });

    }

    catch (error) {

        console.error(

            "[AI Health Error]",

            error.message

        );

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/******************************************************************************
 * AI Dashboard Metrics
 ******************************************************************************/

const getAIDashboard = async (req, res) => {

    try {

        const emails = await Email.find({});

        const analysis =
            await aiEngineService.analyzeBulkEmails(emails);

        const dashboard =
            aiEngineService.buildDashboardMetrics(
                analysis.results || []
            );

        return res.status(200).json({

            success: true,

            data: dashboard,

        });

    }

    catch (error) {

        console.error(

            "[AI Dashboard Error]",

            error.message

        );

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/******************************************************************************
 * AI Statistics
 ******************************************************************************/

const getAIStatistics = async (req, res) => {

    try {

        const emails = await Email.find({});

        const analysis =
            await aiEngineService.analyzeBulkEmails(emails);

        const stats =
            aiEngineService.buildAIStatistics(
                analysis.results || []
            );

        return res.status(200).json({

            success: true,

            data: stats,

        });

    }

    catch (error) {

        console.error(

            "[AI Statistics Error]",

            error.message

        );

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};


/******************************************************************************
 * AI Service Info
 ******************************************************************************/

const getAIServiceInfo = async (req, res) => {

    try {

        const info =
            aiEngineService.getServiceInfo();

        return res.status(200).json({

            success: true,

            data: info,

        });

    }

    catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    /* =========================================================
       Existing AI Reply Features
    ========================================================= */

    generateAIReply,

    sendReply,

    replyAllEmail,

    forwardEmail,

    sendNewMail,

    /* =========================================================
       AI Email Intelligence
    ========================================================= */

    analyzeEmail,

    analyzeBulkEmails,

    reAnalyzeEmail,

    analyzePreview,

    /* =========================================================
       AI Dashboard
    ========================================================= */

    aiHealth,

    getAIDashboard,

    getAIStatistics,

    getAIServiceInfo,

};

/******************************************************************************
 * End controllers/aiController.js
 ******************************************************************************/
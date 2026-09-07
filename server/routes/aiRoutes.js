/******************************************************************************
 * routes/aiRoutes.js
 * Enterprise AI Routes
 ******************************************************************************/

const express = require("express");
const router = express.Router();

/* ==========================================================================
   Controller
========================================================================== */

const {

    /* Existing */

    generateAIReply,
    sendReply,
    replyAllEmail,
    forwardEmail,
    sendNewMail,

    /* AI Intelligence */

    analyzeEmail,
    analyzeBulkEmails,
    reAnalyzeEmail,
    analyzePreview,

    /* Dashboard */

    aiHealth,
    getAIDashboard,
    getAIStatistics,
    getAIServiceInfo,

} = require("../controllers/aiController");

/******************************************************************************
 * Existing AI Reply Routes
 ******************************************************************************/

router.get(

    "/generate-reply/:emailId",

    generateAIReply

);

router.post(

    "/reply/:emailId",

    sendReply

);

router.post(

    "/reply-all/:emailId",

    replyAllEmail

);

router.post(

    "/forward/:emailId",

    forwardEmail

);

router.post(

    "/send-mail",

    sendNewMail

);

/******************************************************************************
 * AI Email Intelligence
 ******************************************************************************/

router.get(

    "/analyze/:emailId",

    analyzeEmail

);

router.post(

    "/analyze/bulk",

    analyzeBulkEmails

);

router.post(

    "/reanalyze/:emailId",

    reAnalyzeEmail

);

router.get(

    "/preview/:emailId",

    analyzePreview

);

/******************************************************************************
 * AI Dashboard
 ******************************************************************************/

router.get(

    "/dashboard",

    getAIDashboard

);

router.get(

    "/statistics",

    getAIStatistics

);

/******************************************************************************
 * AI Health
 ******************************************************************************/

router.get(

    "/health",

    aiHealth

);

router.get(

    "/service-info",

    getAIServiceInfo

);

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = router;

/******************************************************************************
 * End routes/aiRoutes.js
 ******************************************************************************/
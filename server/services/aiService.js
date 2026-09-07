/******************************************************************************
 * services/aiService.js
 * Part 1
 * Enterprise AI Service
 ******************************************************************************/

const aiAutoReplyService = require("./aiAutoReplyService");
const aiClassificationService = require("./aiClassificationService");
const aiEngineService = require("./aiEngineService");
const aiPriorityService = require("./aiPriorityService");

/* ==========================================================================
   Constants
========================================================================== */

const DEFAULT_TONE = "Professional";

const SUPPORTED_TONES = [

    "Professional",

    "Friendly",

    "Formal",

    "Short",

    "Long",

];

/* ==========================================================================
   Logger
========================================================================== */

const log = (message, payload = {}) => {

    console.log(

        `[AI Service] ${message}`,

        payload

    );

};

const errorLog = (message, error) => {

    console.error(

        `[AI Service] ${message}`,

        error?.message || error

    );

};

/******************************************************************************
 * Validate Tone
 ******************************************************************************/

const validateTone = (tone) => {

    if (

        !SUPPORTED_TONES.includes(tone)

    ) {

        return DEFAULT_TONE;

    }

    return tone;

};

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * Generate AI Reply
 ******************************************************************************/

const generateReply = async ({

    email,

    tone = DEFAULT_TONE,

}) => {

    try {

        tone = validateTone(tone);

        log(

            "Generating AI Reply",

            {

                emailId: email._id,

                tone,

            }

        );

        const classification =

            await aiClassificationService
                .classifyEmail(email);

        const priority =

            await aiPriorityService
                .detectPriority(email);

        const reply =

            await aiAutoReplyService
                .generateReply({

                    email,

                    tone,

                    classification,

                    priority,

                });

        return {

            reply,

            tone,

            classification,

            priority,

            confidence: 95,

        };

    }

    catch (error) {

        errorLog(

            "Generate Reply Failed",

            error

        );

        throw error;

    }

};

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Regenerate AI Reply
 ******************************************************************************/

const regenerateReply = async ({

    email,

    tone = DEFAULT_TONE,

    previousReply,

}) => {

    try {

        tone = validateTone(tone);

        log(

            "Regenerating AI Reply",

            {

                emailId: email._id,

                tone,

            }

        );

        const reply =

            await aiEngineService
                .regenerateReply({

                    email,

                    tone,

                    previousReply,

                });

        return {

            reply,

            tone,

            confidence: 96,

        };

    }

    catch (error) {

        errorLog(

            "Regenerate Reply Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Rewrite Reply
 ******************************************************************************/

const rewriteReply = async ({

    reply,

    tone = DEFAULT_TONE,

}) => {

    try {

        tone = validateTone(tone);

        const rewritten =

            await aiEngineService
                .rewriteReply({

                    reply,

                    tone,

                });

        return {

            reply: rewritten,

            tone,

            confidence: 94,

        };

    }

    catch (error) {

        errorLog(

            "Rewrite Reply Failed",

            error

        );

        throw error;

    }

};

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Grammar Fix
 ******************************************************************************/

const grammarFix = async ({

    reply,

}) => {

    try {

        const corrected =

            await aiEngineService
                .grammarFix({

                    reply,

                });

        return {

            reply: corrected,

            confidence: 98,

        };

    }

    catch (error) {

        errorLog(

            "Grammar Fix Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Change Tone
 ******************************************************************************/

const changeTone = async ({

    reply,

    tone = DEFAULT_TONE,

}) => {

    try {

        tone = validateTone(tone);

        const updatedReply =

            await aiEngineService
                .changeTone({

                    reply,

                    tone,

                });

        return {

            reply: updatedReply,

            tone,

            confidence: 97,

        };

    }

    catch (error) {

        errorLog(

            "Change Tone Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Summarize Email
 ******************************************************************************/

const summarizeEmail = async ({

    email,

}) => {

    try {

        const summary =

            await aiEngineService
                .summarizeEmail({

                    email,

                });

        return {

            summary,

            confidence: 95,

        };

    }

    catch (error) {

        errorLog(

            "Summarize Email Failed",

            error

        );

        throw error;

    }

};


/******************************************************************************
 * Analyze Email
 ******************************************************************************/

const analyzeEmail = async ({

    email,

}) => {

    try {

        const classification =

            await aiClassificationService
                .classifyEmail(email);

        const priority =

            await aiPriorityService
                .detectPriority(email);

        return {

            classification,

            priority,

        };

    }

    catch (error) {

        errorLog(

            "Analyze Email Failed",

            error

        );

        throw error;

    }

};

/******************************************************************************
 * Part 5 Ends
 ******************************************************************************/
/******************************************************************************
 * Health Check
 ******************************************************************************/

const health = async () => {

    return {

        success: true,

        service: "AI Service",

        status: "Healthy",

        modules: {

            autoReply: !!aiAutoReplyService,

            engine: !!aiEngineService,

            classification: !!aiClassificationService,

            priority: !!aiPriorityService,

        },

        timestamp: new Date().toISOString(),

    };

};


/******************************************************************************
 * Exports
 ******************************************************************************/

module.exports = {

    generateReply,

    regenerateReply,

    rewriteReply,

    grammarFix,

    changeTone,

    summarizeEmail,

    analyzeEmail,

    health,

};


/******************************************************************************
 * End aiService.js
 ******************************************************************************/
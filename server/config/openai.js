/******************************************************************************
 * config/openai.js
 * OpenAI Configuration
 ******************************************************************************/

const OpenAI = require("openai");

/******************************************************************************
 * Validate Environment Variables
 ******************************************************************************/

if (!process.env.OPENAI_API_KEY) {

    throw new Error(
        "OPENAI_API_KEY is missing in .env"
    );

}

/******************************************************************************
 * OpenAI Client
 ******************************************************************************/

const openai = new OpenAI({

    apiKey: process.env.OPENAI_API_KEY,

});

/******************************************************************************
 * Default Model
 ******************************************************************************/

const DEFAULT_MODEL =

    process.env.OPENAI_MODEL ||

    "gpt-5.5";

/******************************************************************************
 * AI Settings
 ******************************************************************************/

const AI_CONFIG = {

    model: DEFAULT_MODEL,

    temperature: 0.2,

    max_tokens: 1200,

    top_p: 1,

    frequency_penalty: 0,

    presence_penalty: 0,

};

/******************************************************************************
 * Health Check
 ******************************************************************************/

const checkOpenAIConnection = async () => {

    try {

        await openai.models.list();

        return {

            success: true,

            provider: "OpenAI",

            model: DEFAULT_MODEL,

            timestamp: new Date(),

        };

    }

    catch (error) {

        return {

            success: false,

            provider: "OpenAI",

            error: error.message,

        };

    }

};

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    openai,

    AI_CONFIG,

    DEFAULT_MODEL,

    checkOpenAIConnection,

};

/******************************************************************************
 * End config/openai.js
 ******************************************************************************/

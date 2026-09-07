/******************************************************************************
 * AIReplyService.js
 * Part 1
 * Imports + Configuration + Prompt Templates
 ******************************************************************************/

import OpenAI from "openai";

/* ==========================================================================
   OpenAI Client
========================================================================== */

const openai = new OpenAI({

  apiKey: process.env.OPENAI_API_KEY,

});

/* ==========================================================================
   AI Configuration
========================================================================== */

const DEFAULT_MODEL =

  process.env.OPENAI_MODEL ||

  "gpt-5.5";

const DEFAULT_TEMPERATURE = 0.6;

const DEFAULT_MAX_TOKENS = 1000;

/* ==========================================================================
   Supported Reply Tones
========================================================================== */

export const SUPPORTED_TONES = [

  "Professional",

  "Friendly",

  "Formal",

  "Casual",

  "Short",

  "Long",

];

/* ==========================================================================
   System Prompt
========================================================================== */

const SYSTEM_PROMPT = `

You are an enterprise AI Email Reply Assistant.

Rules:

- Generate professional email replies.
- Preserve the original intent.
- Maintain proper grammar.
- Never invent facts.
- Keep replies concise unless Long tone is selected.
- Never include markdown.
- Return plain text only.

`;

/* ==========================================================================
   Tone Prompt Builder
========================================================================== */

const buildTonePrompt = (tone = "Professional") => {

  switch (tone) {

    case "Friendly":
      return "Write a warm and friendly reply.";

    case "Formal":
      return "Write a highly formal business reply.";

    case "Casual":
      return "Write a casual but respectful reply.";

    case "Short":
      return "Write a short reply using less than 80 words.";

    case "Long":
      return "Write a detailed professional reply.";

    case "Professional":
    default:
      return "Write a professional business email reply.";

  }

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 2
 * Generate AI Reply
 ******************************************************************************/

/* ==========================================================================
   Generate AI Reply
========================================================================== */

export const generateReply = async ({
  email,
  tone = "Professional",
}) => {

  if (!email) {
    throw new Error("Email is required.");
  }

  const userPrompt = `

Email Subject:
${email.subject || "No Subject"}

Sender:
${email.sender || "Unknown"}

Email Body:
${email.body || ""}

Instructions:
${buildTonePrompt(tone)}

Generate a complete business email reply.

`;

  try {

    const response =
      await openai.responses.create({

        model: DEFAULT_MODEL,

        input: [

          {
            role: "system",
            content: SYSTEM_PROMPT,
          },

          {
            role: "user",
            content: userPrompt,
          },

        ],

        temperature: DEFAULT_TEMPERATURE,

        max_output_tokens: DEFAULT_MAX_TOKENS,

      });

    const reply =

      response.output_text?.trim() ||

      "";

    return {

      success: true,

      reply,

      tone,

      generatedAt: new Date(),

      usage: response.usage || null,

    };

  } catch (error) {

    console.error(
      "Generate Reply Error:",
      error
    );

    throw new Error(

      error.message ||

      "Failed to generate AI reply."

    );

  }

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 3
 * Regenerate Reply + Rewrite Reply
 ******************************************************************************/

/* ==========================================================================
   Regenerate AI Reply
========================================================================== */

export const regenerateReply = async ({
  email,
  previousReply = "",
  tone = "Professional",
}) => {

  if (!email) {
    throw new Error("Email is required.");
  }

  const userPrompt = `

Email Subject:
${email.subject || "No Subject"}

Sender:
${email.sender || "Unknown"}

Email Body:
${email.body || ""}

Previous Reply:
${previousReply}

Instructions:
${buildTonePrompt(tone)}

Generate a NEW reply.
Do NOT repeat the previous reply.
Keep the meaning but use different wording.

`;

  try {

    const response =
      await openai.responses.create({

        model: DEFAULT_MODEL,

        input: [

          {
            role: "system",
            content: SYSTEM_PROMPT,
          },

          {
            role: "user",
            content: userPrompt,
          },

        ],

        temperature: DEFAULT_TEMPERATURE + 0.2,

        max_output_tokens: DEFAULT_MAX_TOKENS,

      });

    return {

      success: true,

      reply: response.output_text?.trim() || "",

      tone,

      generatedAt: new Date(),

      usage: response.usage || null,

    };

  } catch (error) {

    console.error(
      "Regenerate Reply Error:",
      error
    );

    throw new Error(

      error.message ||

      "Failed to regenerate AI reply."

    );

  }

};

/* ==========================================================================
   Rewrite Existing Reply
========================================================================== */

export const rewriteReply = async ({
  reply,
  tone = "Professional",
}) => {

  if (!reply?.trim()) {
    throw new Error("Reply is required.");
  }

  const userPrompt = `

Existing Reply:

${reply}

Instructions:

${buildTonePrompt(tone)}

Rewrite this reply while:

- preserving meaning
- improving grammar
- improving readability
- keeping business tone
- returning plain text only

`;

  try {

    const response =
      await openai.responses.create({

        model: DEFAULT_MODEL,

        input: [

          {
            role: "system",
            content: SYSTEM_PROMPT,
          },

          {
            role: "user",
            content: userPrompt,
          },

        ],

        temperature: DEFAULT_TEMPERATURE,

        max_output_tokens: DEFAULT_MAX_TOKENS,

      });

    return {

      success: true,

      reply: response.output_text?.trim() || "",

      tone,

      generatedAt: new Date(),

      usage: response.usage || null,

    };

  } catch (error) {

    console.error(
      "Rewrite Reply Error:",
      error
    );

    throw new Error(

      error.message ||

      "Failed to rewrite AI reply."

    );

  }

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 4
 * Grammar Fix + Summarize Reply
 ******************************************************************************/

/* ==========================================================================
   Grammar Correction
========================================================================== */

export const grammarReply = async ({
  reply,
}) => {

  if (!reply?.trim()) {
    throw new Error("Reply is required.");
  }

  const userPrompt = `

Reply:

${reply}

Instructions:

Correct:

- Grammar
- Spelling
- Sentence structure
- Business writing style

Do NOT change the meaning.

Return only the corrected reply.

`;

  try {

    const response =
      await openai.responses.create({

        model: DEFAULT_MODEL,

        input: [

          {
            role: "system",
            content: SYSTEM_PROMPT,
          },

          {
            role: "user",
            content: userPrompt,
          },

        ],

        temperature: 0.2,

        max_output_tokens: DEFAULT_MAX_TOKENS,

      });

    return {

      success: true,

      reply:
        response.output_text?.trim() || "",

      generatedAt: new Date(),

      usage: response.usage || null,

    };

  } catch (error) {

    console.error(
      "Grammar Reply Error:",
      error
    );

    throw new Error(

      error.message ||

      "Failed to improve grammar."

    );

  }

};

/* ==========================================================================
   Summarize Reply
========================================================================== */

export const summarizeReply = async ({
  reply,
}) => {

  if (!reply?.trim()) {
    throw new Error("Reply is required.");
  }

  const userPrompt = `

Reply:

${reply}

Instructions:

Generate:

- Short summary
- Maximum 2 sentences
- Plain text only

`;

  try {

    const response =
      await openai.responses.create({

        model: DEFAULT_MODEL,

        input: [

          {
            role: "system",
            content: SYSTEM_PROMPT,
          },

          {
            role: "user",
            content: userPrompt,
          },

        ],

        temperature: 0.3,

        max_output_tokens: 150,

      });

    return {

      success: true,

      summary:
        response.output_text?.trim() || "",

      generatedAt: new Date(),

      usage: response.usage || null,

    };

  } catch (error) {

    console.error(
      "Summarize Reply Error:",
      error
    );

    throw new Error(

      error.message ||

      "Failed to summarize reply."

    );

  }

};

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 5
 * Helper Functions + Enterprise Export
 ******************************************************************************/

/* ==========================================================================
   Extract Plain Text
========================================================================== */

const extractText = (response) => {

  if (!response) return "";

  return (

    response.output_text?.trim() ||

    response.output?.[0]?.content?.[0]?.text?.trim() ||

    ""

  );

};

/* ==========================================================================
   Common AI Request
========================================================================== */

const executeAIRequest = async ({
  prompt,
  temperature = DEFAULT_TEMPERATURE,
  maxTokens = DEFAULT_MAX_TOKENS,
}) => {

  try {

    const response =
      await openai.responses.create({

        model: DEFAULT_MODEL,

        input: [

          {
            role: "system",
            content: SYSTEM_PROMPT,
          },

          {
            role: "user",
            content: prompt,
          },

        ],

        temperature,

        max_output_tokens: maxTokens,

      });

    return {

      success: true,

      text: extractText(response),

      usage: response.usage || null,

      generatedAt: new Date(),

    };

  } catch (error) {

    console.error(
      "OpenAI Request Error:",
      error
    );

    throw new Error(

      error?.message ||

      "AI request failed."

    );

  }

};

/* ==========================================================================
   Enterprise Service Export
========================================================================== */

const AIReplyService = {

  generateReply,

  regenerateReply,

  rewriteReply,

  grammarReply,

  summarizeReply,

  executeAIRequest,

};

export default AIReplyService;

/******************************************************************************
 * End AIReplyService.js
 ******************************************************************************/
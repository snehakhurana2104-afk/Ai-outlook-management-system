/******************************************************************************
 * promptBuilder.js
 * Part 1
 * Enterprise Prompt Configuration
 ******************************************************************************/

/* ==========================================================================
   Tone Templates
========================================================================== */

export const TONE_PROMPTS = {
  Professional:
    "Write a professional, clear, polite, business-oriented reply.",

  Friendly:
    "Write a warm, friendly, natural, conversational reply.",

  Formal:
    "Write a formal corporate response using professional language.",

  Casual:
    "Write a short casual response while remaining respectful.",

  Short:
    "Write a concise reply in less than 80 words.",

  Long:
    "Write a detailed and complete response with proper structure.",
};

/* ==========================================================================
   System Prompt
========================================================================== */

export const SYSTEM_PROMPT = `
You are an enterprise AI email assistant.

Goals:

- Generate professional Outlook email replies.
- Never invent facts.
- Use only supplied email context.
- Maintain business etiquette.
- Keep responses concise unless requested.
- Preserve sender intent.
- Avoid unnecessary repetition.
- Return only the email reply.
`.trim();
/******************************************************************************
 * promptBuilder.js
 * Part 2
 * Prompt Builder
 ******************************************************************************/

export const buildReplyPrompt = ({
  email,
  tone = "Professional",
  instructions = "",
}) => {

  return `
${SYSTEM_PROMPT}

Tone:
${TONE_PROMPTS[tone]}

Original Email

Subject:
${email.subject}

Sender:
${email.sender}

Body:
${email.body}

Additional Instructions:
${instructions}

Generate the reply.
`.trim();

};
/******************************************************************************
 * promptBuilder.js
 * Part 3
 * Rewrite & Grammar
 ******************************************************************************/

export const buildRewritePrompt = ({
  reply,
  tone = "Professional",
}) => {

  return `
${SYSTEM_PROMPT}

Rewrite the following reply.

Tone:
${TONE_PROMPTS[tone]}

Reply:
${reply}

Return only the rewritten email.
`.trim();

};

export const buildGrammarPrompt = (reply) => {

  return `
Correct grammar, punctuation, spelling,
and improve readability.

Do not change the meaning.

Reply:

${reply}

Return corrected reply only.
`.trim();

};
/******************************************************************************
 * promptBuilder.js
 * Part 4
 * Summary Builder
 ******************************************************************************/

export const buildSummaryPrompt = (email) => {

  return `
Summarize the following email.

Subject:
${email.subject}

Body:
${email.body}

Return a concise executive summary.
`.trim();

};

const PromptBuilder = {
  buildReplyPrompt,
  buildRewritePrompt,
  buildGrammarPrompt,
  buildSummaryPrompt,
};

export default PromptBuilder;
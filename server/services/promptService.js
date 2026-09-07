/******************************************************************************
 * promptService.js
 * Part 1
 ******************************************************************************/

const TONES = {

  professional: `
Write in a professional business tone.
Be respectful.
Be concise.
Avoid unnecessary words.
`,

  friendly: `
Write in a friendly conversational tone.
Remain polite.
Keep positive language.
`,

  formal: `
Write in a formal corporate tone.
Use business vocabulary.
`,

  empathetic: `
Respond with empathy.
Show understanding.
Maintain professionalism.
`,

  concise: `
Keep the response extremely short.
Avoid unnecessary explanations.
`,

};

class PromptService {

  buildReplyPrompt({

    email = "",

    tone = "professional",

    instructions = "",

  }) {

    return `
You are an Enterprise AI Email Assistant.

Generate the best email reply.

Email:

${email}

Tone:

${TONES[tone] || TONES.professional}

Instructions:

${instructions}

Rules:

- Do not invent facts.
- Preserve meaning.
- Return plain text only.
- No markdown.
`;

  }
  /******************************************************************************
 * promptService.js
 * Part 2
 * Rewrite + Grammar Prompt Builder
 ******************************************************************************/

/* ==========================================================================
   Build Rewrite Prompt
========================================================================== */

buildRewritePrompt({

  reply = "",

  tone = "professional",

  instructions = "",

}) {

  return `
You are an Enterprise AI Email Assistant.

Rewrite the following email reply.

Original Reply:

${reply}

Tone:

${TONES[tone] || TONES.professional}

Additional Instructions:

${instructions}

Rules:

- Preserve the original meaning.
- Improve clarity.
- Improve readability.
- Improve professionalism.
- Remove repetition.
- Do not invent facts.
- Return plain text only.
- Do not use markdown.
`;

}

/* ==========================================================================
   Build Grammar Prompt
========================================================================== */

buildGrammarPrompt({

  reply = "",

  mode = "standard",

}) {

  return `
You are an Enterprise Grammar Assistant.

Correct grammar, spelling and punctuation.

Reply:

${reply}

Mode:

${mode}

Rules:

- Preserve the original meaning.
- Do not rewrite unnecessarily.
- Improve sentence flow.
- Preserve formatting.
- Return plain text only.
- Do not use markdown.
`;

}
/******************************************************************************
 * promptService.js
 * Part 3
 * Summary + Professional + Friendly Prompt Builder
 ******************************************************************************/

/* ==========================================================================
   Build Summary Prompt
========================================================================== */

buildSummaryPrompt(email = "") {

  return `
You are an Enterprise AI Email Assistant.

Summarize the following email.

Email:

${email}

Rules:

- Maximum 5 bullet points.
- Include important action items.
- Mention deadlines if available.
- Mention people if relevant.
- Do not invent information.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Professional Prompt
========================================================================== */

buildProfessionalPrompt(reply = "") {

  return `
You are an Enterprise Business Communication Expert.

Rewrite the following email reply in a professional corporate tone.

Reply:

${reply}

Rules:

- Professional language.
- Business email style.
- Improve clarity.
- Improve grammar.
- Preserve meaning.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Friendly Prompt
========================================================================== */

buildFriendlyPrompt(reply = "") {

  return `
You are a Friendly Email Assistant.

Rewrite the following reply using a warm, friendly and polite tone.

Reply:

${reply}

Rules:

- Friendly.
- Positive.
- Natural.
- Preserve meaning.
- Improve readability.
- Return plain text only.
`;

}
/******************************************************************************
 * promptService.js
 * Part 4
 * Short Reply + Long Reply + Follow-up + Escalation
 ******************************************************************************/

/* ==========================================================================
   Build Short Reply Prompt
========================================================================== */

buildShortReplyPrompt(reply = "") {

  return `
You are an Enterprise AI Email Assistant.

Rewrite the following reply into a short professional email.

Reply:

${reply}

Rules:

- Maximum 3 short paragraphs.
- Keep the original meaning.
- Be concise.
- Maintain professionalism.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Long Reply Prompt
========================================================================== */

buildLongReplyPrompt(reply = "") {

  return `
You are an Enterprise AI Email Assistant.

Expand the following email reply into a detailed professional response.

Reply:

${reply}

Rules:

- Add clarity.
- Improve professionalism.
- Keep the original meaning.
- Do not invent facts.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Follow-up Prompt
========================================================================== */

buildFollowUpPrompt({

  email = "",

  reply = "",

}) {

  return `
You are an Enterprise Follow-up Email Assistant.

Original Email:

${email}

Previous Reply:

${reply}

Generate a professional follow-up email.

Rules:

- Friendly.
- Professional.
- Action-oriented.
- Preserve context.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Escalation Prompt
========================================================================== */

buildEscalationPrompt({

  email = "",

  reason = "",

}) {

  return `
You are an Enterprise Escalation Email Assistant.

Email:

${email}

Escalation Reason:

${reason}

Generate a professional escalation email.

Rules:

- Professional tone.
- Explain the issue clearly.
- Request immediate action.
- Do not invent information.
- Return plain text only.
`;

}
/******************************************************************************
 * promptService.js
 * Part 5
 * Utility Methods + Export
 ******************************************************************************/

/* ==========================================================================
   Get Tone Prompt
========================================================================== */

getTonePrompt(tone = "professional") {

  return (

    TONES[tone] ||

    TONES.professional

  );

}

/* ==========================================================================
   Get Available Tones
========================================================================== */

getAvailableTones() {

  return Object.keys(TONES);

}

/* ==========================================================================
   Check Supported Tone
========================================================================== */

isSupportedTone(tone) {

  return Object.prototype.hasOwnProperty.call(

    TONES,

    tone

  );

}

/* ==========================================================================
   Get Default Tone
========================================================================== */

getDefaultTone() {

  return "professional";

}

}

/* ==========================================================================
   Singleton Instance
========================================================================== */

const promptService =
  new PromptService();

/* ==========================================================================
   Export
========================================================================== */

module.exports = promptService;

/******************************************************************************
 * End promptService.js
 ******************************************************************************/

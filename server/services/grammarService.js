/******************************************************************************
 * grammarService.js
 * Part 1
 * Enterprise Grammar Prompt Service
 ******************************************************************************/

/* ==========================================================================
   Grammar Modes
========================================================================== */

const GRAMMAR_MODES = {

  standard: `
Correct grammar, spelling and punctuation.
Preserve the original meaning.
`,

  professional: `
Rewrite using professional business English.
Improve clarity and grammar.
`,

  formal: `
Rewrite using formal corporate language.
Correct all grammar mistakes.
`,

  friendly: `
Rewrite using a friendly conversational tone.
Correct grammar while keeping it natural.
`,

  concise: `
Correct grammar and shorten unnecessary wording.
Keep the meaning unchanged.
`,

};

/* ==========================================================================
   Grammar Service
========================================================================== */

class GrammarService {

  /* ========================================================================
     Build Grammar Prompt
  ======================================================================== */

  buildGrammarPrompt(

    reply = "",

    mode = "standard"

  ) {

    return `
You are an Enterprise AI Grammar Assistant.

Task:

Correct the following email.

Email:

${reply}

Grammar Mode:

${GRAMMAR_MODES[mode] || GRAMMAR_MODES.standard}

Rules:

- Correct grammar.
- Correct spelling.
- Correct punctuation.
- Preserve meaning.
- Do not invent information.
- Return plain text only.
- Do not use markdown.
`;

  }
  /******************************************************************************
 * grammarService.js
 * Part 2
 * Spelling + Punctuation + Readability
 ******************************************************************************/

/* ==========================================================================
   Build Spelling Prompt
========================================================================== */

buildSpellingPrompt(reply = "") {

  return `
You are an Enterprise AI Writing Assistant.

Correct only spelling mistakes.

Text:

${reply}

Rules:

- Do not rewrite.
- Do not change meaning.
- Preserve formatting.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Punctuation Prompt
========================================================================== */

buildPunctuationPrompt(reply = "") {

  return `
You are an Enterprise AI Writing Assistant.

Correct punctuation only.

Text:

${reply}

Rules:

- Keep wording unchanged.
- Preserve meaning.
- Improve punctuation only.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Readability Prompt
========================================================================== */

buildReadabilityPrompt(reply = "") {

  return `
You are an Enterprise AI Writing Assistant.

Improve readability.

Text:

${reply}

Rules:

- Keep meaning unchanged.
- Improve sentence flow.
- Improve clarity.
- Preserve professionalism.
- Return plain text only.
`;

}
/******************************************************************************
 * grammarService.js
 * Part 3
 * Professional + Friendly + Formal Tone
 ******************************************************************************/

/* ==========================================================================
   Professional Tone
========================================================================== */

buildProfessionalPrompt(reply = "") {

  return `
Rewrite the following email using a professional business tone.

Email:

${reply}

Rules:

- Professional.
- Clear.
- Concise.
- Preserve meaning.
- Return plain text only.
`;

}

/* ==========================================================================
   Friendly Tone
========================================================================== */

buildFriendlyPrompt(reply = "") {

  return `
Rewrite the following email using a friendly and polite tone.

Email:

${reply}

Rules:

- Friendly.
- Positive.
- Natural.
- Preserve meaning.
- Return plain text only.
`;

}

/* ==========================================================================
   Formal Tone
========================================================================== */

buildFormalPrompt(reply = "") {

  return `
Rewrite the following email using a formal corporate tone.

Email:

${reply}

Rules:

- Formal.
- Business language.
- Professional.
- Preserve meaning.
- Return plain text only.
`;

}
/******************************************************************************
 * grammarService.js
 * Part 4
 * Utility Prompt Builders
 ******************************************************************************/

/* ==========================================================================
   Build Simplify Prompt
========================================================================== */

buildSimplifyPrompt(reply = "") {

  return `
Simplify the following email.

Email:

${reply}

Rules:

- Easy to understand.
- Preserve meaning.
- Professional.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Shorten Prompt
========================================================================== */

buildShortenPrompt(reply = "") {

  return `
Shorten the following email.

Email:

${reply}

Rules:

- Remove unnecessary words.
- Preserve meaning.
- Professional.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Expand Prompt
========================================================================== */

buildExpandPrompt(reply = "") {

  return `
Expand the following email.

Email:

${reply}

Rules:

- Add clarity.
- Add professionalism.
- Preserve meaning.
- Return plain text only.
`;

}

/* ==========================================================================
   Build Proofread Prompt
========================================================================== */

buildProofreadPrompt(reply = "") {

  return `
Proofread the following email.

Email:

${reply}

Rules:

- Grammar
- Spelling
- Punctuation
- Sentence Flow
- Return plain text only.
`;

}
/******************************************************************************
 * grammarService.js
 * Part 5
 * Utility Methods + Export
 ******************************************************************************/

/* ==========================================================================
   Available Modes
========================================================================== */

getAvailableModes() {

  return Object.keys(GRAMMAR_MODES);

}

/* ==========================================================================
   Check Supported Mode
========================================================================== */

isSupportedMode(mode) {

  return Object.prototype.hasOwnProperty.call(

    GRAMMAR_MODES,

    mode

  );

}

/* ==========================================================================
   Get Default Mode
========================================================================== */

getDefaultMode() {

  return "standard";

}

}

/* ==========================================================================
   Singleton
========================================================================== */

const grammarService =
  new GrammarService();

/* ==========================================================================
   Export
========================================================================== */

module.exports = grammarService;

/******************************************************************************
 * End grammarService.js
 ******************************************************************************/
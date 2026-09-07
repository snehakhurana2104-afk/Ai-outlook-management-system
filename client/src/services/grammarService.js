/******************************************************************************
 * grammarService.js
 * Part 1
 * Enterprise Grammar Configuration
 ******************************************************************************/

/* ==========================================================================
   Grammar Modes
========================================================================== */

export const GRAMMAR_MODES = {
  FIX: "fix",
  PROOFREAD: "proofread",
  IMPROVE: "improve",
  BUSINESS: "business",
};

/* ==========================================================================
   Default Mode
========================================================================== */

export const DEFAULT_MODE =
  GRAMMAR_MODES.IMPROVE;
  /******************************************************************************
 * grammarService.js
 * Part 2
 * Prompt Builder
 ******************************************************************************/

export const buildGrammarPrompt = (
  text,
  mode = DEFAULT_MODE
) => {

  switch (mode) {

    case GRAMMAR_MODES.FIX:
      return `
Correct spelling, grammar and punctuation.

Do not change meaning.

Text:

${text}
`.trim();

    case GRAMMAR_MODES.PROOFREAD:
      return `
Proofread the following email.

Improve grammar.

Improve punctuation.

Improve readability.

Do not change intent.

Text:

${text}
`.trim();

    case GRAMMAR_MODES.BUSINESS:
      return `
Rewrite using professional business English.

Improve grammar.

Improve clarity.

Maintain original intent.

Text:

${text}
`.trim();

    default:
      return `
Improve grammar.

Improve readability.

Improve sentence flow.

Keep original meaning.

Text:

${text}
`.trim();

  }

};
/******************************************************************************
 * grammarService.js
 * Part 3
 * Helpers
 ******************************************************************************/

export const isEmptyText = (text) => {
  return !text || text.trim().length === 0;
};

export const normalizeText = (text) => {

  if (!text) return "";

  return text
    .replace(/\s+/g, " ")
    .trim();

};

export const countWords = (text) => {

  if (isEmptyText(text)) return 0;

  return normalizeText(text)
    .split(" ")
    .length;

};

export const countCharacters = (text) => {

  return text ? text.length : 0;

};
/******************************************************************************
 * grammarService.js
 * Part 4
 * Export
 ******************************************************************************/

const GrammarService = {

  GRAMMAR_MODES,

  DEFAULT_MODE,

  buildGrammarPrompt,

  normalizeText,

  countWords,

  countCharacters,

  isEmptyText,

};

export default GrammarService;
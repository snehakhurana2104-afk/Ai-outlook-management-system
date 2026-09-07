/******************************************************************************
 * AIReplyService.js
 * Part 1
 * Enterprise AI Reply Service
 * Imports + Constants + Utilities
 ******************************************************************************/

/* ==========================================================================
   Configuration
========================================================================== */

const DEFAULT_TONE = "Professional";

const SUPPORTED_TONES = [
  "Professional",
  "Friendly",
  "Formal",
  "Executive",
  "Empathetic",
];

/* ==========================================================================
   Sentiment Dictionaries
========================================================================== */

const POSITIVE_WORDS = [
  "thanks",
  "thank you",
  "great",
  "excellent",
  "happy",
  "appreciate",
  "good",
  "wonderful",
  "successful",
  "resolved",
  "completed",
];

const NEGATIVE_WORDS = [
  "issue",
  "problem",
  "error",
  "failed",
  "urgent",
  "delay",
  "complaint",
  "critical",
  "bug",
  "unable",
  "blocked",
];

/* ==========================================================================
   Stop Words
========================================================================== */

const STOP_WORDS = [
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "have",
  "will",
  "your",
  "about",
  "into",
  "their",
  "they",
  "been",
  "were",
  "what",
  "when",
  "where",
  "which",
  "there",
  "would",
  "could",
  "shall",
  "should",
  "also",
];

/* ==========================================================================
   Safe String
========================================================================== */

const safeString = (value = "") => {

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();

};

/* ==========================================================================
   Normalize Text
========================================================================== */

const normalizeText = (text = "") => {

  return safeString(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

};

/* ==========================================================================
   Validate Tone
========================================================================== */

const validateTone = (tone = DEFAULT_TONE) => {

  return SUPPORTED_TONES.includes(tone)
    ? tone
    : DEFAULT_TONE;

};

/* ==========================================================================
   Enterprise Logger
========================================================================== */

const logError = (context, error) => {

  console.error(
    `[AIReplyService] ${context}:`,
    error?.message || error
  );

};

/******************************************************************************
 * End Part 1
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 2
 * Enterprise Analysis Engine
 * Sentiment + Confidence + Language Detection
 ******************************************************************************/

/* ==========================================================================
   Detect Sentiment
========================================================================== */

const detectSentiment = (text = "") => {

  const normalized = normalizeText(text);

  let positiveScore = 0;
  let negativeScore = 0;

  POSITIVE_WORDS.forEach((word) => {

    if (normalized.includes(word)) {
      positiveScore++;
    }

  });

  NEGATIVE_WORDS.forEach((word) => {

    if (normalized.includes(word)) {
      negativeScore++;
    }

  });

  if (positiveScore > negativeScore) {
    return "Positive";
  }

  if (negativeScore > positiveScore) {
    return "Negative";
  }

  return "Neutral";

};

/* ==========================================================================
   Detect Language
========================================================================== */

const detectLanguage = (text = "") => {

  const normalized = normalizeText(text);

  if (!normalized) {
    return "Unknown";
  }

  const hindiPattern =
    /[\u0900-\u097F]/;

  if (hindiPattern.test(text)) {
    return "Hindi";
  }

  return "English";

};

/* ==========================================================================
   Calculate Confidence Score
========================================================================== */

const calculateConfidence = (email = {}) => {

  let score = 40;

  if (safeString(email.subject)) {
    score += 15;
  }

  if (safeString(email.body)) {
    score += 20;
  }

  if (safeString(email.category)) {
    score += 10;
  }

  if (safeString(email.priority)) {
    score += 5;
  }

  if (safeString(email.senderName)) {
    score += 5;
  }

  if (safeString(email.company)) {
    score += 5;
  }

  return Math.min(score, 100);

};

/******************************************************************************
 * End Part 2
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 3
 * Enterprise NLP Engine
 * Keyword Extraction + Summary Generation
 ******************************************************************************/

/* ==========================================================================
   Extract Keywords
========================================================================== */

const extractKeywords = (
  text = "",
  limit = 10
) => {

  const normalized =
    normalizeText(text);

  if (!normalized) {
    return [];
  }

  const words = normalized

    .split(" ")

    .filter(

      (word) =>

        word &&

        word.length > 3 &&

        !STOP_WORDS.includes(word)

    );

  const frequency = {};

  words.forEach((word) => {

    frequency[word] =
      (frequency[word] || 0) + 1;

  });

  return Object.entries(frequency)

    .sort((a, b) => b[1] - a[1])

    .slice(0, limit)

    .map(([word]) => word);

};

/* ==========================================================================
   Generate Summary
========================================================================== */

const generateSummary = (
  text = "",
  maxLength = 180
) => {

  const cleanText =
    safeString(text);

  if (!cleanText) {
    return "";
  }

  const sentences = cleanText

    .split(/[.!?]+/)

    .map((sentence) =>
      sentence.trim()
    )

    .filter(Boolean);

  if (!sentences.length) {
    return "";
  }

  const summary = sentences[0];

  return summary.length > maxLength

    ? `${summary.substring(0, maxLength)}...`

    : summary;

};

/* ==========================================================================
   Email Analysis
========================================================================== */

const analyzeEmail = (email = {}) => {

  const text = `
    ${email.subject || ""}
    ${email.body || ""}
  `;

  return {

    sentiment:
      detectSentiment(text),

    confidence:
      calculateConfidence(email),

    language:
      detectLanguage(text),

    summary:
      generateSummary(email.body),

    keywords:
      extractKeywords(text),

  };

};

/******************************************************************************
 * End Part 3
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 4
 * Enterprise Reply Generation Engine
 ******************************************************************************/

/* ==========================================================================
   Generate AI Reply
========================================================================== */

const generateReply = async ({
  email = {},
  tone = DEFAULT_TONE,
}) => {

  try {

    const validTone = validateTone(tone);

    const senderName =
      safeString(email.senderName) || "Sir/Madam";

    const company =
      safeString(email.company);

    const subject =
      normalizeText(email.subject);

    const category =
      normalizeText(email.category);

    const priority =
      normalizeText(email.priority);

    let reply = "";

    /* ==========================================================
       Training
    ========================================================== */

    if (category.includes("training")) {

      reply = `Dear ${senderName},

Thank you for contacting us regarding the training program.

We have received your request and our team is reviewing the details.

We will share the complete information shortly.

Regards,
Customer Success Team`;

    }

    /* ==========================================================
       Support
    ========================================================== */

    else if (

      category.includes("support") ||

      subject.includes("issue") ||

      subject.includes("problem")

    ) {

      reply = `Dear ${senderName},

Thank you for contacting our support team.

We sincerely apologize for the inconvenience caused.

Our technical team is investigating your concern and will provide an update as soon as possible.

Regards,
Support Team`;

    }

    /* ==========================================================
       Meeting
    ========================================================== */

    else if (

      category.includes("meeting") ||

      subject.includes("meeting")

    ) {

      reply = `Dear ${senderName},

Thank you for your meeting request.

We have received your email and will confirm the meeting schedule shortly.

Regards,
Customer Success Team`;

    }

    /* ==========================================================
       High Priority
    ========================================================== */

    else if (priority === "high") {

      reply = `Dear ${senderName},

Thank you for your email.

Your request has been marked as HIGH PRIORITY and has already been forwarded to the concerned team.

We will respond at the earliest possible time.

Regards,
Customer Success Team`;

    }

    /* ==========================================================
       Company Specific
    ========================================================== */

    else if (company) {

      reply = `Dear ${senderName},

Thank you for contacting us.

We appreciate your email regarding ${company}.

Our team is reviewing your request and will get back to you shortly.

Regards,
Customer Success Team`;

    }

    /* ==========================================================
       Default
    ========================================================== */

    else {

      reply = `Dear ${senderName},

Thank you for your email.

We have successfully received your message.

Our team is reviewing your request and will respond shortly.

Regards,
Customer Success Team`;

    }

    const analysis =
      analyzeEmail(email);

    return {

      reply,

      tone: validTone,

      confidence:
        analysis.confidence,

      sentiment:
        analysis.sentiment,

      summary:
        analysis.summary,

      keywords:
        analysis.keywords,

      language:
        analysis.language,

      model:
        "Rule-Based Enterprise",

      generatedAt:
        new Date(),

    };

  }

  catch (error) {

    logError(
      "generateReply",
      error
    );

    throw new Error(
      "Failed to generate AI reply."
    );

  }

};

/******************************************************************************
 * End Part 4
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 5
 * Enterprise Regenerate Reply
 ******************************************************************************/

/* ==========================================================================
   Regenerate AI Reply
========================================================================== */

const regenerateReply = async ({
  email = {},
  tone = DEFAULT_TONE,
  previousReply = "",
}) => {

  try {

    const result = await generateReply({

      email,

      tone,

    });

    /* ==========================================================
       Prevent Duplicate Replies
    ========================================================== */

    if (

      safeString(previousReply) &&

      safeString(previousReply) ===
      safeString(result.reply)

    ) {

      result.reply += `

Please let us know if you need any additional clarification.

We will be happy to assist you further.

Thank you for your patience.`;

    }

    /* ==========================================================
       Metadata
    ========================================================== */

    result.regenerated = true;

    result.previousReply = previousReply;

    result.generatedAt = new Date();

    return result;

  }

  catch (error) {

    logError(
      "regenerateReply",
      error
    );

    throw new Error(
      "Failed to regenerate AI reply."
    );

  }

};

/******************************************************************************
 * End Part 5
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 6
 * Enterprise Rewrite + Grammar Engine
 ******************************************************************************/

/* ==========================================================================
   Rewrite Reply
========================================================================== */

const rewriteReply = async ({
  reply = "",
  tone = DEFAULT_TONE,
}) => {

  try {

    const validTone = validateTone(tone);

    let rewrittenReply = safeString(reply);

    if (!rewrittenReply) {

      return {

        reply: "",

        tone: validTone,

      };

    }

    switch (validTone) {

      /* ========================================================
         Friendly
      ======================================================== */

      case "Friendly":

        rewrittenReply = rewrittenReply.replace(

          /^Dear\s+/i,

          "Hello "

        );

        rewrittenReply +=

          "\n\nHave a wonderful day!";

        break;

      /* ========================================================
         Formal
      ======================================================== */

      case "Formal":

        rewrittenReply +=

          "\n\nKind Regards,";

        break;

      /* ========================================================
         Executive
      ======================================================== */

      case "Executive":

        rewrittenReply +=

          "\n\nPlease feel free to contact us for any strategic assistance.";

        break;

      /* ========================================================
         Empathetic
      ======================================================== */

      case "Empathetic":

        rewrittenReply +=

          "\n\nWe sincerely appreciate your patience and understanding.";

        break;

      /* ========================================================
         Professional
      ======================================================== */

      default:

        rewrittenReply +=

          "\n\nThank you for your cooperation.";

        break;

    }

    return {

      reply: rewrittenReply,

      tone: validTone,

      rewritten: true,

      updatedAt: new Date(),

    };

  }

  catch (error) {

    logError(

      "rewriteReply",

      error

    );

    throw new Error(

      "Failed to rewrite AI reply."

    );

  }

};

/* ==========================================================================
   Grammar Correction
========================================================================== */

const grammarReply = async ({
  reply = "",
}) => {

  try {

    let correctedReply = safeString(reply);

    if (!correctedReply) {

      return {

        reply: "",

      };

    }

    correctedReply = correctedReply

      .replace(/\s+/g, " ")

      .replace(/\s+\./g, ".")

      .replace(/\s+,/g, ",")

      .replace(/\s+!/g, "!")

      .replace(/\s+\?/g, "?")

      .replace(/\bi\b/g, "I")

      .replace(/\bim\b/gi, "I'm")

      .replace(/\bdont\b/gi, "don't")

      .replace(/\bcant\b/gi, "can't")

      .trim();

    return {

      reply: correctedReply,

      grammarCorrected: true,

      updatedAt: new Date(),

    };

  }

  catch (error) {

    logError(

      "grammarReply",

      error

    );

    throw new Error(

      "Grammar correction failed."

    );

  }

};

/******************************************************************************
 * End Part 6
 ******************************************************************************/
/******************************************************************************
 * AIReplyService.js
 * Part 7
 * Enterprise Summary + Export
 ******************************************************************************/

/* ==========================================================================
   Summarize Reply
========================================================================== */

const summarizeReply = async ({
  reply = "",
}) => {

  try {

    const cleanReply = safeString(reply);

    if (!cleanReply) {

      return {

        summary: "",

      };

    }

    const summary = generateSummary(cleanReply);

    return {

      summary,

      generatedAt: new Date(),

    };

  }

  catch (error) {

    logError(

      "summarizeReply",

      error

    );

    throw new Error(

      "Failed to summarize AI reply."

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

  analyzeEmail,

  extractKeywords,

  detectSentiment,

  detectLanguage,

  calculateConfidence,

};

/******************************************************************************
 * Export Service
 ******************************************************************************/

module.exports = AIReplyService;

/******************************************************************************
 * End AIReplyService.js
 ******************************************************************************/
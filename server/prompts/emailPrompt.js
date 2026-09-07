/******************************************************************************
 * prompts/emailPrompt.js
 * Enterprise Email Intelligence Prompts
 ******************************************************************************/

/******************************************************************************
 * System Prompt
 ******************************************************************************/

const SYSTEM_PROMPT = `
You are an Enterprise AI Email Intelligence Assistant.

Your job is to analyze Microsoft Outlook emails.

Always return ONLY valid JSON.

Never return markdown.

Never explain.

Never add extra text.

Always return the exact schema requested.
`;

/******************************************************************************
 * Email Analysis Prompt
 ******************************************************************************/

const buildEmailAnalysisPrompt = (email) => {

    return `
Analyze the following Outlook email.

Subject:
${email.subject || ""}

From:
${email.from || ""}

To:
${email.to || ""}

Received:
${email.receivedDateTime || ""}

Body:
${email.body || ""}

Return ONLY JSON.

Schema:

{
  "classification":"",
  "priority":"",
  "importanceScore":0,
  "urgency":"",
  "spam":false,
  "spamConfidence":0,
  "sentiment":"",
  "riskLevel":"",
  "tags":[],
  "summary":"",
  "suggestedAction":"",
  "confidence":0
}

Rules:

classification:
Work
Client
Finance
HR
Meeting
Marketing
Newsletter
Support
Legal
Personal
Other

priority:
Critical
High
Medium
Low

urgency:
Immediate
Today
This Week
No Deadline

sentiment:
Positive
Neutral
Negative
Angry
Urgent

riskLevel:
Low
Medium
High

importanceScore:
0-100

confidence:
0-100

spam:
true or false

spamConfidence:
0-100

tags:
maximum 10 tags

summary:
maximum 60 words

suggestedAction:
maximum 30 words
`;

};

/******************************************************************************
 * Reply Generator Prompt
 ******************************************************************************/

const buildReplyPrompt = (

    email,

    tone = "Professional"

) => {

    return `
Generate an enterprise email reply.

Tone:

${tone}

Subject:

${email.subject}

Body:

${email.body}

Write a professional response.

Maximum 200 words.

Return ONLY the reply text.
`;

};

/******************************************************************************
 * Email Summary Prompt
 ******************************************************************************/

const buildSummaryPrompt = (email) => {

    return `
Summarize this email.

${email.body}

Maximum 50 words.

Return ONLY the summary.
`;

};

/******************************************************************************
 * Priority Prompt
 ******************************************************************************/

const buildPriorityPrompt = (email) => {

    return `
Determine email priority.

Subject:

${email.subject}

Body:

${email.body}

Return ONLY JSON

{
 "priority":"",
 "importanceScore":0,
 "urgency":"",
 "confidence":0
}
`;

};

/******************************************************************************
 * Sentiment Prompt
 ******************************************************************************/

const buildSentimentPrompt = (email) => {

    return `
Determine sentiment.

Body:

${email.body}

Return ONLY JSON

{
 "sentiment":"",
 "confidence":0
}
`;

};

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = {

    SYSTEM_PROMPT,

    buildEmailAnalysisPrompt,

    buildReplyPrompt,

    buildSummaryPrompt,

    buildPriorityPrompt,

    buildSentimentPrompt,

};

/******************************************************************************
 * End prompts/emailPrompt.js
 ******************************************************************************/
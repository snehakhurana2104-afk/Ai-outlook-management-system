"use strict";

/******************************************************************************
 * openaiService.js
 * Enterprise OpenAI Service
 * CommonJS version
 *
 * IMPORTANT:
 * - This file uses require/module.exports.
 * - Do NOT add another `const OpenAI = require("openai")`
 *   anywhere inside this file.
 ******************************************************************************/

const OpenAI = require("openai");

/* ============================================================================
   Environment Variables
============================================================================ */

const {
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENAI_BASE_URL,
  OPENAI_TIMEOUT,
  OPENAI_MAX_RETRIES,
} = process.env;

/* ============================================================================
   Configuration
============================================================================ */

const DEFAULT_MODEL =
  OPENAI_MODEL || "gpt-4.1-mini";

const DEFAULT_TIMEOUT =
  Number(OPENAI_TIMEOUT || 60000);

const MAX_RETRIES =
  Number(OPENAI_MAX_RETRIES || 3);

/* ============================================================================
   Validation
============================================================================ */

if (!OPENAI_API_KEY) {
  console.warn(
    "[OpenAI] OPENAI_API_KEY is not configured."
  );
}

/* ============================================================================
   OpenAI Client
============================================================================ */

const client = OPENAI_API_KEY
  ? new OpenAI({
      apiKey: OPENAI_API_KEY,

      ...(OPENAI_BASE_URL
        ? {
            baseURL: OPENAI_BASE_URL,
          }
        : {}),

      timeout: DEFAULT_TIMEOUT,

      maxRetries: MAX_RETRIES,
    })
  : null;

/* ============================================================================
   System Prompt
============================================================================ */

const DEFAULT_SYSTEM_PROMPT = `
You are an enterprise AI email assistant.

Your responsibilities:

- Generate professional email replies.
- Maintain the original intent.
- Correct grammar.
- Improve clarity.
- Keep responses concise unless requested otherwise.
- Never hallucinate facts.
- Never fabricate names, companies, dates, or commitments.
- Use only information provided in the email/context.
- Return plain text unless another format is explicitly requested.
`.trim();

/* ============================================================================
   OpenAI Service
============================================================================ */

class OpenAIService {
  constructor() {
    this.client = client;

    this.defaultModel =
      DEFAULT_MODEL;

    this.defaultSystemPrompt =
      DEFAULT_SYSTEM_PROMPT;
  }

  /* ==========================================================================
     Utility
  ========================================================================== */

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /* ==========================================================================
     Validate Messages
  ========================================================================== */

  validateMessages(messages) {
    if (!Array.isArray(messages)) {
      throw new Error(
        "Messages must be an array."
      );
    }

    if (messages.length === 0) {
      throw new Error(
        "Messages cannot be empty."
      );
    }

    for (const message of messages) {
      if (!message || typeof message !== "object") {
        throw new Error(
          "Invalid message format."
        );
      }

      if (!message.role) {
        throw new Error(
          "Message role is required."
        );
      }

      if (
        message.content === undefined ||
        message.content === null
      ) {
        throw new Error(
          "Message content is required."
        );
      }
    }
  }

  /* ==========================================================================
     Chat Completion
  ========================================================================== */

  async chatCompletion({
    messages,
    model = this.defaultModel,
    temperature = 0.4,
    maxTokens = 1000,
  }) {
    this.validateMessages(messages);

    if (!this.client) {
      throw new Error(
        "OpenAI API key is not configured."
      );
    }

    let lastError = null;

    for (
      let attempt = 1;
      attempt <= MAX_RETRIES;
      attempt++
    ) {
      try {
        const response =
          await this.client.chat.completions.create({
            model,
            temperature,
            max_tokens: maxTokens,
            messages,
          });

        return response;
      } catch (error) {
        lastError = error;

        console.error(
          `[OpenAI Attempt ${attempt}/${MAX_RETRIES}]`,
          error.message
        );

        if (
          attempt < MAX_RETRIES
        ) {
          await this.sleep(
            attempt * 1000
          );
        }
      }
    }

    throw lastError;
  }

  /* ==========================================================================
     Generic Completion
  ========================================================================== */

  async complete({
    prompt,
    systemPrompt = this.defaultSystemPrompt,
    model,
    temperature = 0.4,
    maxTokens = 1000,
  }) {
    if (!prompt) {
      throw new Error(
        "Prompt is required."
      );
    }

    return await this.chatCompletion({
      model,
      temperature,
      maxTokens,

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },

        {
          role: "user",
          content: prompt,
        },
      ],
    });
  }

  /* ==========================================================================
     Extract Response Text
  ========================================================================== */

  extractText(response) {
    return (
      response?.choices?.[0]?.message?.content?.trim() ||
      ""
    );
  }

  /* ==========================================================================
     Generate Reply
  ========================================================================== */

  async generateReply(prompt) {
    const response =
      await this.complete({
        prompt,
        temperature: 0.4,
        maxTokens: 1000,
      });

    return this.extractText(
      response
    );
  }

  /* ==========================================================================
     Rewrite Reply
  ========================================================================== */

  async rewriteReply(prompt) {
    const response =
      await this.complete({
        prompt,
        temperature: 0.5,
        maxTokens: 1000,
      });

    return this.extractText(
      response
    );
  }

  /* ==========================================================================
     Grammar Correction
  ========================================================================== */

  async grammarReply(prompt) {
    const response =
      await this.complete({
        prompt,
        temperature: 0.2,
        maxTokens: 1000,
      });

    return this.extractText(
      response
    );
  }

  /* ==========================================================================
     Summarize Email
  ========================================================================== */

  async summarizeReply(prompt) {
    const response =
      await this.complete({
        prompt,
        temperature: 0.3,
        maxTokens: 500,
      });

    return this.extractText(
      response
    );
  }

  /* ==========================================================================
     Generate Email Summary
  ========================================================================== */

  async summarizeEmail(
    subject,
    body
  ) {
    const prompt = `
Summarize the following email.

Subject:
${subject || "No subject"}

Email:
${body || "No email body"}

Return:
- Main purpose
- Important points
- Required action
- Important deadline, if explicitly mentioned

Do not invent information.
`.trim();

    return await this.summarizeReply(
      prompt
    );
  }

  /* ==========================================================================
     Generate Suggested Reply
  ========================================================================== */

  async generateSuggestedReply({
    subject = "",
    body = "",
    senderName = "",
    tone = "professional",
  } = {}) {
    const prompt = `
Generate a professional email reply.

Sender:
${senderName || "Unknown sender"}

Subject:
${subject || "No subject"}

Original Email:
${body || "No email body"}

Tone:
${tone}

Requirements:
- Reply directly to the original email.
- Keep the original intent.
- Do not invent facts.
- Do not promise anything not mentioned.
- Keep the response concise.
- Return only the email reply.
`.trim();

    return await this.generateReply(
      prompt
    );
  }

  /* ==========================================================================
     Health Check
  ========================================================================== */

  async healthCheck() {
    try {
      if (!this.client) {
        return {
          success: false,
          status: "not_configured",
          message:
            "OPENAI_API_KEY is not configured.",
          model:
            this.defaultModel,
          checkedAt:
            new Date().toISOString(),
        };
      }

      const response =
        await this.chatCompletion({
          messages: [
            {
              role: "user",
              content: "Reply with OK",
            },
          ],

          temperature: 0,

          maxTokens: 5,
        });

      return {
        success: true,

        status: "healthy",

        model:
          this.defaultModel,

        response:
          this.extractText(
            response
          ) || "OK",

        checkedAt:
          new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,

        status: "unhealthy",

        message:
          error.message,

        checkedAt:
          new Date().toISOString(),
      };
    }
  }

  /* ==========================================================================
     Extract Token Usage
  ========================================================================== */

  getUsage(response) {
    if (!response?.usage) {
      return {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
    }

    return {
      promptTokens:
        response.usage
          .prompt_tokens || 0,

      completionTokens:
        response.usage
          .completion_tokens || 0,

      totalTokens:
        response.usage
          .total_tokens || 0,
    };
  }

  /* ==========================================================================
     Response Metadata
  ========================================================================== */

  getMetadata(response) {
    return {
      id:
        response?.id || null,

      model:
        response?.model ||
        this.defaultModel,

      created:
        response?.created || null,

      object:
        response?.object || null,

      usage:
        this.getUsage(
          response
        ),
    };
  }

  /* ==========================================================================
     Enterprise Error Mapping
  ========================================================================== */

  mapError(error) {
    if (!error) {
      return {
        code: "UNKNOWN",
        message: "Unknown error",
        retryable: false,
      };
    }

    const status =
      Number(
        error.status ||
        error.statusCode ||
        0
      );

    switch (status) {
      case 400:
        return {
          code: "BAD_REQUEST",
          message:
            "Invalid OpenAI request.",
          retryable: false,
        };

      case 401:
        return {
          code: "UNAUTHORIZED",
          message:
            "Invalid OpenAI API key.",
          retryable: false,
        };

      case 403:
        return {
          code: "FORBIDDEN",
          message:
            "OpenAI permission denied.",
          retryable: false,
        };

      case 404:
        return {
          code: "NOT_FOUND",
          message:
            "Requested OpenAI model or resource was not found.",
          retryable: false,
        };

      case 408:
        return {
          code: "TIMEOUT",
          message:
            "OpenAI request timed out.",
          retryable: true,
        };

      case 429:
        return {
          code: "RATE_LIMIT",
          message:
            "OpenAI rate limit exceeded.",
          retryable: true,
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          code: "SERVER_ERROR",
          message:
            "OpenAI service is temporarily unavailable.",
          retryable: true,
        };

      default:
        return {
          code:
            error.code ||
            "OPENAI_ERROR",

          message:
            error.message ||
            "OpenAI request failed.",

          retryable: false,
        };
    }
  }

  /* ==========================================================================
     Service Information
  ========================================================================== */

  getServiceInfo() {
    return {
      provider: "OpenAI",

      model:
        this.defaultModel,

      timeout:
        DEFAULT_TIMEOUT,

      retries:
        MAX_RETRIES,

      configured:
        Boolean(
          OPENAI_API_KEY
        ),

      baseURL:
        OPENAI_BASE_URL ||
        "https://api.openai.com",
    };
  }
}

/* ============================================================================
   Singleton Instance
============================================================================ */

const openAIService =
  new OpenAIService();

/* ============================================================================
   Initialization Log
============================================================================ */

try {
  console.info(
    "[OpenAI] Service initialized successfully."
  );

  console.info(
    "[OpenAI] Model:",
    openAIService.defaultModel
  );

  console.info(
    "[OpenAI] API configured:",
    Boolean(OPENAI_API_KEY)
  );
} catch (error) {
  console.error(
    "[OpenAI] Initialization failed:",
    error.message
  );
}

/* ============================================================================
   Export
============================================================================ */

module.exports =
  openAIService;

/******************************************************************************
 * End openaiService.js
 ******************************************************************************/
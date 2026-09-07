/******************************************************************************
 * aiAutoReplyService.js
 * Part 1
 * Enterprise AI Auto Reply Service
 ******************************************************************************/

const OpenAI = require("openai");

/* ==========================================================================
   Configuration
========================================================================== */

const AI_PROVIDER =
  process.env.AI_PROVIDER || "openai";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || "gpt-4.1-mini";

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY;

const AI_TIMEOUT =
  Number(process.env.AI_TIMEOUT || 60000);

const MAX_RETRIES =
  Number(process.env.AI_MAX_RETRIES || 3);

/* ==========================================================================
   AI Auto Reply Service
========================================================================== */

class AIAutoReplyService {

  constructor() {

    if (!OPENAI_API_KEY) {

      throw new Error(
        "OPENAI_API_KEY environment variable is missing."
      );

    }

    this.provider = AI_PROVIDER;

    this.model = OPENAI_MODEL;

    this.timeout = AI_TIMEOUT;

    this.maxRetries = MAX_RETRIES;

    this.client = new OpenAI({

      apiKey: OPENAI_API_KEY,

      timeout: this.timeout,

    });

  }

  /* ==========================================================================
     Delay Helper
  ========================================================================== */

  sleep(ms) {

    return new Promise((resolve) => {

      setTimeout(resolve, ms);

    });

  }

  /* ==========================================================================
     Retry Wrapper
  ========================================================================== */

  async execute(requestFn) {

    let lastError = null;

    for (

      let attempt = 1;

      attempt <= this.maxRetries;

      attempt++

    ) {

      try {

        return await requestFn();

      }

      catch (error) {

        lastError = error;

        console.error(

          `[AI Auto Reply Retry ${attempt}]`,

          error.message

        );

        if (attempt < this.maxRetries) {

          await this.sleep(

            attempt * 1500

          );

        }

      }

    }

    throw lastError;

  }
  /******************************************************************************
 * generateReply()
 ******************************************************************************/

  async generateReply({

    subject = "",

    body = "",

    sender = "",

    tone = "professional",

  }) {

    return await this.execute(

      async () => {

        const response =

          await this.client.responses.create({

            model: this.model,

            input: [

              {

                role: "system",

                content:
                  "You are an enterprise AI email assistant. Generate a professional reply. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Subject:
${subject}

Body:
${body}

Tone:
${tone}

Generate a professional email reply.

Return JSON:

{
  "reply":"",
  "confidence":0,
  "tone":"${tone}"
}

`

              }

            ]

          });

        const text =

          response.output_text || "{}";

        let result;

        try {

          result = JSON.parse(text);

        }

        catch {

          result = {

            reply: text,

            confidence: 0,

            tone,

          };

        }

        return {

          success: true,

          response: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * generateProfessionalReply()
 ******************************************************************************/

  async generateProfessionalReply({

    subject = "",

    body = "",

    sender = "",

  }) {

    return await this.generateReply({

      subject,

      body,

      sender,

      tone: "professional",

    });

  }
  /******************************************************************************
 * generateFollowUpReply()
 ******************************************************************************/

  async generateFollowUpReply({

    subject = "",

    body = "",

    sender = "",

  }) {

    return await this.execute(

      async () => {

        const response =

          await this.client.responses.create({

            model: this.model,

            input: [

              {

                role: "system",

                content:
                  "You are an enterprise AI email assistant. Generate a polite follow-up email. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Subject:
${subject}

Original Email:
${body}

Generate a professional FOLLOW-UP reply.

Return JSON:

{
  "reply":"",
  "confidence":0,
  "type":"follow_up"
}

`

              }

            ]

          });

        const text =

          response.output_text || "{}";

        let result;

        try {

          result = JSON.parse(text);

        }

        catch {

          result = {

            reply: text,

            confidence: 0,

            type: "follow_up",

          };

        }

        return {

          success: true,

          response: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * generateMeetingReply()
 ******************************************************************************/

  async generateMeetingReply({

    subject = "",

    body = "",

    sender = "",

    availability = "",

  }) {

    return await this.execute(

      async () => {

        const response =

          await this.client.responses.create({

            model: this.model,

            input: [

              {

                role: "system",

                content:
                  "You are an enterprise AI assistant. Generate a professional meeting response. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Subject:
${subject}

Meeting Request:
${body}

Availability:
${availability}

Generate a meeting reply.

Return JSON:

{
  "reply":"",
  "confidence":0,
  "type":"meeting"
}

`

              }

            ]

          });

        const text =

          response.output_text || "{}";

        let result;

        try {

          result = JSON.parse(text);

        }

        catch {

          result = {

            reply: text,

            confidence: 0,

            type: "meeting",

          };

        }

        return {

          success: true,

          response: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }
  /******************************************************************************
 * generateCustomReply()
 ******************************************************************************/

  async generateCustomReply({

    subject = "",

    body = "",

    sender = "",

    instructions = "",

    tone = "professional",

  }) {

    return await this.execute(

      async () => {

        const response =

          await this.client.responses.create({

            model: this.model,

            input: [

              {

                role: "system",

                content:
                  "You are an enterprise AI email assistant. Generate a custom email reply. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Subject:
${subject}

Email:
${body}

Instructions:
${instructions}

Tone:
${tone}

Generate a custom email reply.

Return JSON:

{
  "reply":"",
  "tone":"${tone}",
  "confidence":0
}

`

              }

            ]

          });

        const text =

          response.output_text || "{}";

        let result;

        try {

          result = JSON.parse(text);

        }

        catch {

          result = {

            reply: text,

            tone,

            confidence: 0,

          };

        }

        return {

          success: true,

          response: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * improveReply()
 ******************************************************************************/

  async improveReply({

    reply = "",

    tone = "professional",

  }) {

    return await this.execute(

      async () => {

        const response =

          await this.client.responses.create({

            model: this.model,

            input: [

              {

                role: "system",

                content:
                  "You improve enterprise emails. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Improve the following email.

Tone:
${tone}

Reply:

${reply}

Return JSON:

{
  "improvedReply":"",
  "tone":"${tone}",
  "confidence":0
}

`

              }

            ]

          });

        const text =

          response.output_text || "{}";

        let result;

        try {

          result = JSON.parse(text);

        }

        catch {

          result = {

            improvedReply: text,

            tone,

            confidence: 0,

          };

        }

        return {

          success: true,

          response: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }
  /******************************************************************************
 * healthCheck()
 ******************************************************************************/

  async healthCheck() {

    try {

      const response =

        await this.client.responses.create({

          model: this.model,

          input: [

            {

              role: "user",

              content:
                "Reply with exactly: OK"

            }

          ]

        });

      return {

        success: true,

        provider:
          this.provider,

        service:
          "AI Auto Reply Service",

        model:
          this.model,

        status:
          "Healthy",

        response:
          response.output_text,

        checkedAt:
          new Date().toISOString(),

      };

    }

    catch (error) {

      return this.mapAIError(error);

    }

  }

  /******************************************************************************
   * mapAIError()
   ******************************************************************************/

  mapAIError(error) {

    return {

      success: false,

      provider:
        this.provider,

      status:

        error?.status ||

        error?.response?.status ||

        500,

      code:

        error?.code ||

        error?.response?.data?.error?.code ||

        "AI_ERROR",

      message:

        error?.message ||

        "Unknown AI Error",

    };

  }

  /******************************************************************************
   * getServiceInfo()
   ******************************************************************************/

  getServiceInfo() {

    return {

      provider:
        this.provider,

      service:
        "AI Auto Reply Service",

      model:
        this.model,

      timeout:
        this.timeout,

      retries:
        this.maxRetries,

      supports: [

        "Generate Reply",

        "Professional Reply",

        "Follow-up Reply",

        "Meeting Reply",

        "Custom Reply",

        "Improve Reply",

      ],

    };

  }

} // ================= END OF CLASS =================


/******************************************************************************
 * Singleton
 ******************************************************************************/

const aiAutoReplyService =
  new AIAutoReplyService();


/******************************************************************************
 * Initialization
 ******************************************************************************/

try {

  console.info(

    "[AI] AIAutoReplyService initialized."

  );

}

catch (error) {

  console.error(

    "[AI]",

    error.message

  );

}


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports =
  aiAutoReplyService;

/******************************************************************************
 * End aiAutoReplyService.js
 ******************************************************************************/
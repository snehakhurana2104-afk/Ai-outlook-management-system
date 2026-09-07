/******************************************************************************
 * aiPriorityService.js
 * Part 1
 * Enterprise AI Priority Prediction Service
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
   AI Priority Service
========================================================================== */

class AIPriorityService {

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

          `[AI Priority Retry ${attempt}]`,

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
 * predictPriority()
 ******************************************************************************/

  async predictPriority({

    subject = "",

    body = "",

    sender = "",

    importance = "normal",

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
                  "You are an enterprise AI priority prediction engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Importance:
${importance}

Subject:
${subject}

Body:
${body}

Predict the email priority.

Return JSON:

{
  "priority":"",
  "score":0,
  "reason":""
}

Priority must be one of:

High
Medium
Low

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

            priority: "Medium",

            score: 0,

            reason: text,

          };

        }

        return {

          success: true,

          prediction: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * predictBulkPriority()
 ******************************************************************************/

  async predictBulkPriority({

    emails = [],

  }) {

    if (!Array.isArray(emails)) {

      throw new Error(

        "emails must be an array."

      );

    }

    const predictions = [];

    for (const email of emails) {

      const result =

        await this.predictPriority({

          subject:
            email.subject,

          body:
            email.body,

          sender:
            email.sender,

          importance:
            email.importance || "normal",

        });

      predictions.push({

        id:
          email.id,

        ...result,

      });

    }

    return {

      success: true,

      total:
        predictions.length,

      predictions,

      completedAt:
        new Date().toISOString(),

    };

  }
  /******************************************************************************
 * predictResponseUrgency()
 ******************************************************************************/

  async predictResponseUrgency({

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
                  "You are an enterprise AI response urgency prediction engine. Return ONLY valid JSON."

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

Predict response urgency.

Return JSON:

{
  "urgency":"",
  "responseTime":"",
  "confidence":0,
  "reason":""
}

urgency values:

Immediate
Today
Within 24 Hours
This Week
No Hurry

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

            urgency: "Today",

            responseTime: "24 Hours",

            confidence: 0,

            reason: text,

          };

        }

        return {

          success: true,

          prediction: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * predictEscalationRisk()
 ******************************************************************************/

  async predictEscalationRisk({

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
                  "You are an enterprise AI escalation prediction engine. Return ONLY valid JSON."

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

Predict escalation risk.

Return JSON:

{
  "risk":"",
  "score":0,
  "reason":""
}

risk values:

High
Medium
Low

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

            risk: "Low",

            score: 0,

            reason: text,

          };

        }

        return {

          success: true,

          prediction: result,

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
          "AI Priority Service",

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
        "AI Priority Service",

      model:
        this.model,

      timeout:
        this.timeout,

      retries:
        this.maxRetries,

      supports: [

        "Priority Prediction",

        "Bulk Priority Prediction",

        "Response Urgency",

        "Escalation Risk",

        "Business Impact",

        "SLA Breach Prediction",

      ],

    };

  }

} // ================= END OF CLASS =================


/******************************************************************************
 * Singleton
 ******************************************************************************/

const aiPriorityService =
  new AIPriorityService();


/******************************************************************************
 * Initialization
 ******************************************************************************/

try {

  console.info(

    "[AI] AIPriorityService initialized."

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
  aiPriorityService;

/******************************************************************************
 * End aiPriorityService.js
 ******************************************************************************/
/******************************************************************************
 * aiSLAService.js
 * Part 1
 * Enterprise AI SLA Prediction Service
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
   AI SLA Service
========================================================================== */

class AISLAService {

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

          `[AI SLA Retry ${attempt}]`,

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
 * predictSLA()
 ******************************************************************************/

  async predictSLA({

    subject = "",

    body = "",

    sender = "",

    priority = "Medium",

    slaHours = 24,

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
                  "You are an enterprise AI SLA prediction engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Priority:
${priority}

Configured SLA:
${slaHours} Hours

Subject:
${subject}

Body:
${body}

Predict SLA status.

Return JSON:

{
  "slaRisk":"",
  "probability":0,
  "expectedResponseHours":0,
  "reason":""
}

slaRisk values:

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

            slaRisk: "Medium",

            probability: 0,

            expectedResponseHours: slaHours,

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
 * predictBulkSLA()
 ******************************************************************************/

  async predictBulkSLA({

    emails = [],

  }) {

    if (!Array.isArray(emails)) {

      throw new Error(

        "emails must be an array."

      );

    }

    const predictions = [];

    for (const email of emails) {

      const prediction =

        await this.predictSLA({

          subject:
            email.subject,

          body:
            email.body,

          sender:
            email.sender,

          priority:
            email.priority || "Medium",

          slaHours:
            email.slaHours || 24,

        });

      predictions.push({

        id:
          email.id,

        ...prediction,

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
 * predictResponseDeadline()
 ******************************************************************************/

  async predictResponseDeadline({

    subject = "",

    body = "",

    sender = "",

    priority = "Medium",

    slaHours = 24,

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
                  "You are an enterprise AI response deadline prediction engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Priority:
${priority}

SLA Hours:
${slaHours}

Subject:
${subject}

Body:
${body}

Predict response deadline.

Return JSON:

{
  "recommendedDeadline":"",
  "remainingHours":0,
  "confidence":0,
  "reason":""
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

            recommendedDeadline: "",

            remainingHours: slaHours,

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
 * predictSLAViolation()
 ******************************************************************************/

  async predictSLAViolation({

    subject = "",

    body = "",

    sender = "",

    priority = "Medium",

    slaHours = 24,

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
                  "You are an enterprise AI SLA violation prediction engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Priority:
${priority}

Configured SLA:
${slaHours} Hours

Subject:
${subject}

Body:
${body}

Predict whether this email is likely to violate SLA.

Return JSON:

{
  "willBreach":false,
  "risk":"Low",
  "probability":0,
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

            willBreach: false,

            risk: "Low",

            probability: 0,

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
 * recommendSLAAction()
 ******************************************************************************/

  async recommendSLAAction({

    subject = "",

    body = "",

    sender = "",

    priority = "Medium",

    slaHours = 24,

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
                  "You are an enterprise AI SLA recommendation engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Priority:
${priority}

Configured SLA:
${slaHours} Hours

Subject:
${subject}

Body:
${body}

Recommend the best SLA action.

Return JSON:

{
  "recommendedAction":"",
  "priorityLevel":"",
  "estimatedResolutionHours":0,
  "reason":""
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

            recommendedAction: "Review",

            priorityLevel: priority,

            estimatedResolutionHours: slaHours,

            reason: text,

          };

        }

        return {

          success: true,

          recommendation: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * predictEscalationTimeline()
 ******************************************************************************/

  async predictEscalationTimeline({

    subject = "",

    body = "",

    sender = "",

    priority = "Medium",

    slaHours = 24,

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
                  "You are an enterprise AI escalation timeline engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Priority:
${priority}

Configured SLA:
${slaHours} Hours

Subject:
${subject}

Body:
${body}

Predict escalation timeline.

Return JSON:

{
  "willEscalate":false,
  "estimatedEscalationHours":0,
  "severity":"",
  "reason":""
}

Severity values:

Critical
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

            willEscalate: false,

            estimatedEscalationHours: slaHours,

            severity: "Low",

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
          "AI SLA Service",

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
        "AI SLA Service",

      model:
        this.model,

      timeout:
        this.timeout,

      retries:
        this.maxRetries,

      supports: [

        "Predict SLA",

        "Bulk SLA Prediction",

        "Response Deadline",

        "SLA Violation Prediction",

        "SLA Action Recommendation",

        "Escalation Timeline Prediction",

      ],

    };

  }

} // ================= END OF CLASS =================


/******************************************************************************
 * Singleton
 ******************************************************************************/

const aiSLAService =
  new AISLAService();


/******************************************************************************
 * Initialization
 ******************************************************************************/

try {

  console.info(

    "[AI] AISLAService initialized."

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
  aiSLAService;

/******************************************************************************
 * End aiSLAService.js
 ******************************************************************************/
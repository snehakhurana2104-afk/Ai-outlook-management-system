/******************************************************************************
 * aiClassificationService.js
 * Part 1
 * Enterprise AI Classification Service
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
   AI Classification Service
========================================================================== */

class AIClassificationService {

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

          `[AI Classification Retry ${attempt}]`,

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
 * classifyEmail()
 ******************************************************************************/

  async classifyEmail({

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
                  "You are an enterprise AI email classification engine. Return ONLY valid JSON."

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

Analyze this email.

Return JSON:

{
  "category":"",
  "priority":"",
  "intent":"",
  "sentiment":"",
  "confidence":0,
  "summary":"",
  "tags":[]
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

            category: "Unknown",

            priority: "Medium",

            intent: "Unknown",

            sentiment: "Neutral",

            confidence: 0,

            summary: "",

            tags: [],

            raw: text,

          };

        }

        return {

          success: true,

          classification: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * classifyBulkEmails()
 ******************************************************************************/

  async classifyBulkEmails({

    emails = [],

  }) {

    if (!Array.isArray(emails)) {

      throw new Error(

        "emails must be an array."

      );

    }

    const results = [];

    for (const email of emails) {

      const classification =

        await this.classifyEmail({

          subject:
            email.subject,

          body:
            email.body,

          sender:
            email.sender,

        });

      results.push({

        id:
          email.id,

        ...classification,

      });

    }

    return {

      success: true,

      total:
        results.length,

      results,

      completedAt:
        new Date().toISOString(),

    };

  }
  /******************************************************************************
 * detectIntent()
 ******************************************************************************/

  async detectIntent({

    subject = "",

    body = "",

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
                  "You are an enterprise AI intent detection engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Subject:
${subject}

Body:
${body}

Detect the PRIMARY intent of this email.

Possible intents:

- Request
- Complaint
- Approval
- Meeting
- Follow-up
- Information
- Sales
- Support
- Finance
- HR
- Legal
- Other

Return JSON:

{
  "intent":"",
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

            intent: "Unknown",

            confidence: 0,

            reason: "",

            raw: text,

          };

        }

        return {

          success: true,

          intent: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * extractEntities()
 ******************************************************************************/

  async extractEntities({

    subject = "",

    body = "",

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
                  "Extract structured entities from enterprise emails. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Subject:
${subject}

Body:
${body}

Extract:

- people
- companies
- dates
- emailAddresses
- phoneNumbers
- locations

Return JSON:

{
  "people":[],
  "companies":[],
  "dates":[],
  "emailAddresses":[],
  "phoneNumbers":[],
  "locations":[]
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

            people: [],

            companies: [],

            dates: [],

            emailAddresses: [],

            phoneNumbers: [],

            locations: [],

            raw: text,

          };

        }

        return {

          success: true,

          entities: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }
  /******************************************************************************
 * generateClassificationSummary()
 ******************************************************************************/

  async generateClassificationSummary({

    subject = "",

    body = "",

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
                  "You are an enterprise email summarization engine. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Subject:
${subject}

Body:
${body}

Generate:

1. Executive Summary (Maximum 80 words)

2. Key Action Items

3. Suggested Priority

Return JSON:

{
  "summary":"",
  "actionItems":[],
  "suggestedPriority":""
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

            summary: "",

            actionItems: [],

            suggestedPriority: "Medium",

            raw: text,

          };

        }

        return {

          success: true,

          summary: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * generateTags()
 ******************************************************************************/

  async generateTags({

    subject = "",

    body = "",

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
                  "Generate enterprise email tags. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Subject:
${subject}

Body:
${body}

Generate 5 to 10 meaningful enterprise tags.

Examples:

Finance
Invoice
Meeting
HR
Legal
Urgent
Vendor
Customer
Follow-up
Approval
Support
Sales

Return JSON:

{
  "tags":[]
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

            tags: [],

            raw: text,

          };

        }

        return {

          success: true,

          tags: result.tags || [],

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
                "Reply with only the word OK."

            }

          ]

        });

      return {

        success: true,

        provider: this.provider,

        service: "AI Classification Service",

        model: this.model,

        status: "Healthy",

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

        "AI Classification Service",

      model:

        this.model,

      timeout:

        this.timeout,

      retries:

        this.maxRetries,

      features: [

        "Email Classification",

        "Bulk Classification",

        "Intent Detection",

        "Entity Extraction",

        "Executive Summary",

        "Smart Tags",

      ],

    };

  }

} // ================= END OF CLASS =================


/******************************************************************************
 * Singleton
 ******************************************************************************/

const aiClassificationService =
  new AIClassificationService();


/******************************************************************************
 * Initialization
 ******************************************************************************/

console.info(
  "[AI] AIClassificationService initialized."
);


/******************************************************************************
 * Export
 ******************************************************************************/

module.exports =
  aiClassificationService;
/******************************************************************************
 * aiSuggestionService.js
 * Part 1
 * Enterprise AI Suggestion Service
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
   AI Suggestion Service
========================================================================== */

class AISuggestionService {

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

          `[AI Suggestion Retry ${attempt}]`,

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
 * generateSuggestions()
 ******************************************************************************/

  async generateSuggestions({

    subject = "",

    body = "",

    sender = "",

    priority = "Medium",

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
                  "You are an Enterprise AI Email Assistant. Generate actionable suggestions. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Priority:
${priority}

Subject:
${subject}

Body:
${body}

Generate smart suggestions.

Return JSON:

{
  "suggestions":[
    {
      "title":"",
      "description":"",
      "action":"",
      "priority":""
    }
  ]
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

            suggestions: [],

            raw: text,

          };

        }

        return {

          success: true,

          suggestions:

            result.suggestions || [],

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * generateBulkSuggestions()
 ******************************************************************************/

  async generateBulkSuggestions({

    emails = [],

  }) {

    if (!Array.isArray(emails)) {

      throw new Error(

        "emails must be an array."

      );

    }

    const suggestions = [];

    for (const email of emails) {

      const result =

        await this.generateSuggestions({

          subject:
            email.subject,

          body:
            email.body,

          sender:
            email.sender,

          priority:
            email.priority || "Medium",

        });

      suggestions.push({

        id:
          email.id,

        ...result,

      });

    }

    return {

      success: true,

      total:
        suggestions.length,

      suggestions,

      completedAt:
        new Date().toISOString(),

    };

  }
  /******************************************************************************
 * generateReplySuggestions()
 ******************************************************************************/

  async generateReplySuggestions({

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
                  "You are an Enterprise AI Email Assistant. Generate reply suggestions. Return ONLY valid JSON."

              },

              {

                role: "user",

                content: `

Sender:
${sender}

Tone:
${tone}

Subject:
${subject}

Body:
${body}

Generate 3 reply suggestions.

Return JSON:

{
  "replies":[
    {
      "title":"",
      "reply":""
    }
  ]
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

            replies: [],

            raw: text,

          };

        }

        return {

          success: true,

          replies:

            result.replies || [],

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * generateTaskSuggestions()
 ******************************************************************************/

  async generateTaskSuggestions({

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
                  "You are an Enterprise AI Task Assistant. Extract actionable tasks from emails. Return ONLY valid JSON."

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

Extract action items.

Return JSON:

{
  "tasks":[
    {
      "title":"",
      "description":"",
      "priority":"",
      "dueDate":""
    }
  ]
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

            tasks: [],

            raw: text,

          };

        }

        return {

          success: true,

          tasks:

            result.tasks || [],

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }
  /******************************************************************************
 * generateMeetingSuggestions()
 ******************************************************************************/

  async generateMeetingSuggestions({

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
                  "You are an Enterprise AI Meeting Assistant. Return ONLY valid JSON."

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

Analyze this email and suggest meetings if required.

Return JSON:

{
  "meetingRequired":true,
  "reason":"",
  "suggestedDuration":"30 Minutes",
  "participants":[],
  "agenda":[]
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

            meetingRequired: false,

            reason: text,

            suggestedDuration: "",

            participants: [],

            agenda: [],

          };

        }

        return {

          success: true,

          meeting: result,

          generatedAt:
            new Date().toISOString(),

        };

      }

    );

  }

/******************************************************************************
 * generateWorkflowSuggestions()
 ******************************************************************************/

  async generateWorkflowSuggestions({

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
                  "You are an Enterprise Workflow Optimization AI. Return ONLY valid JSON."

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

Suggest workflow improvements.

Return JSON:

{
  "workflowSuggestions":[
    {
      "title":"",
      "description":"",
      "benefit":"",
      "priority":""
    }
  ]
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

            workflowSuggestions: [],

            raw: text,

          };

        }

        return {

          success: true,

          workflowSuggestions:

            result.workflowSuggestions || [],

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
          "AI Suggestion Service",

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
        "AI Suggestion Service",

      model:
        this.model,

      timeout:
        this.timeout,

      retries:
        this.maxRetries,

      supports: [

        "Email Suggestions",

        "Bulk Suggestions",

        "Reply Suggestions",

        "Task Suggestions",

        "Meeting Suggestions",

        "Workflow Suggestions",

      ],

    };

  }

} // ================= END OF CLASS =================


/******************************************************************************
 * Singleton
 ******************************************************************************/

const aiSuggestionService =
  new AISuggestionService();


/******************************************************************************
 * Initialization
 ******************************************************************************/

try {

  console.info(

    "[AI] AISuggestionService initialized."

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
  aiSuggestionService;

/******************************************************************************
 * End aiSuggestionService.js
 ******************************************************************************/
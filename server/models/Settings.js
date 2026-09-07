"use strict";

const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    general: {
      applicationName: {
        type: String,
        default: "Microsoft 365 Management",
        trim: true,
        maxlength: 200,
      },

      organizationName: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
      },

      language: {
        type: String,
        enum: ["en", "hi"],
        default: "en",
        trim: true,
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata",
        trim: true,
      },

      dateFormat: {
        type: String,
        enum: [
          "DD/MM/YYYY",
          "MM/DD/YYYY",
          "YYYY-MM-DD",
        ],
        default: "DD/MM/YYYY",
        trim: true,
      },

      refreshInterval: {
        type: Number,
        min: 10,
        max: 3600,
        default: 60,
      },

      theme: {
        type: String,
        enum: [
          "System",
          "Light",
          "Dark",
        ],
        default: "System",
        trim: true,
      },

      landingPage: {
        type: String,
        enum: [
          "Dashboard",
          "Analytics",
          "Operations",
          "Inbox",
        ],
        default: "Dashboard",
        trim: true,
      },
    },

    appearance: {
      theme: {
        type: String,
        enum: [
          "System",
          "Light",
          "Dark",
        ],
        default: "System",
        trim: true,
      },

      compactMode: {
        type: Boolean,
        default: false,
      },

      animations: {
        type: Boolean,
        default: true,
      },

      highContrast: {
        type: Boolean,
        default: false,
      },
    },

    localization: {
      language: {
        type: String,
        enum: ["en", "hi"],
        default: "en",
        trim: true,
      },

      timezone: {
        type: String,
        default: "Asia/Kolkata",
        trim: true,
      },

      dateFormat: {
        type: String,
        enum: [
          "DD/MM/YYYY",
          "MM/DD/YYYY",
          "YYYY-MM-DD",
        ],
        default: "DD/MM/YYYY",
        trim: true,
      },

      region: {
        type: String,
        enum: [
          "IN",
          "US",
          "GB",
        ],
        default: "IN",
        trim: true,
      },
    },

    ai: {
      model: {
        type: String,
        enum: [
          "",
          "enterprise",
          "gpt",
        ],
        default: "",
        trim: true,
      },

      summaryLength: {
        type: String,
        enum: [
          "Short",
          "Medium",
          "Detailed",
        ],
        default: "Medium",
        trim: true,
      },

      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.7,
      },

      autoCategory: {
        type: Boolean,
        default: true,
      },

      priorityDetection: {
        type: Boolean,
        default: true,
      },

      replySuggestions: {
        type: Boolean,
        default: true,
      },

      summarization: {
        type: Boolean,
        default: true,
      },

      taskGeneration: {
        type: Boolean,
        default: true,
      },

      followUp: {
        type: Boolean,
        default: true,
      },
    },

    notifications: {
      emailAlerts: {
        type: Boolean,
        default: true,
      },

      desktopNotifications: {
        type: Boolean,
        default: true,
      },

      highPriorityAlerts: {
        type: Boolean,
        default: true,
      },

      browserNotifications: {
        type: Boolean,
        default: true,
      },

      dailySummary: {
        type: Boolean,
        default: true,
      },

      weeklyReport: {
        type: Boolean,
        default: true,
      },

      monthlyReport: {
        type: Boolean,
        default: true,
      },

      dndMode: {
        type: Boolean,
        default: false,
      },

      frequency: {
        type: String,
        enum: [
          "Immediately",
          "Hourly",
          "Daily",
          "Weekly",
        ],
        default: "Immediately",
        trim: true,
      },
    },

    security: {
      sessionTimeout: {
        type: Number,
        min: 5,
        max: 1440,
        default: 30,
      },

      twoFactor: {
        type: Boolean,
        default: false,
      },

      passwordPolicy: {
        type: String,
        enum: [
          "Configured",
          "Strong",
          "Standard",
        ],
        default: "Configured",
        trim: true,
      },

      apiSecret: {
        type: String,
        default: "",
        select: false,
        maxlength: 500,
      },

      activeSessions: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    dashboard: {
      defaultPeriod: {
        type: String,
        enum: [
          "Today",
          "Week",
          "Month",
          "Quarter",
          "Year",
        ],
        default: "Month",
        trim: true,
      },

      showKPIs: {
        type: Boolean,
        default: true,
      },

      showCharts: {
        type: Boolean,
        default: true,
      },

      showRecentActivity: {
        type: Boolean,
        default: true,
      },

      autoRefresh: {
        type: Boolean,
        default: true,
      },
    },

    outlook: {
      syncEnabled: {
        type: Boolean,
        default: true,
      },

      syncInterval: {
        type: Number,
        min: 10,
        max: 3600,
        default: 60,
      },

      includeAttachments: {
        type: Boolean,
        default: true,
      },

      syncCalendar: {
        type: Boolean,
        default: false,
      },

      syncContacts: {
        type: Boolean,
        default: false,
      },

      syncDeleted: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
    strict: true,
  }
);

settingsSchema.index({
  userId: 1,
});

settingsSchema.methods.toSafeObject =
  function () {
    const object =
      this.toObject();

    delete object._id;

    if (object.security) {
      delete object.security.apiSecret;
    }

    return object;
  };

settingsSchema.statics.getOrCreateForUser =
  async function (userId) {
    if (!userId) {
      throw new Error(
        "userId is required to load settings."
      );
    }

    let settings =
      await this.findOne({
        userId,
      }).select("+security.apiSecret");

    if (!settings) {
      settings =
        await this.create({
          userId,
        });
    }

    return settings;
  };

settingsSchema.pre(
  "save",
  function (next) {
    try {
      if (
        this.general &&
        this.general.language
      ) {
        this.general.language =
          this.general.language.toLowerCase();
      }

      if (
        this.localization &&
        this.localization.language
      ) {
        this.localization.language =
          this.localization.language.toLowerCase();
      }

      next();
    } catch (error) {
      next(error);
    }
  }
);

settingsSchema.set(
  "toJSON",
  {
    transform: function (
      doc,
      ret
    ) {
      delete ret._id;

      if (ret.security) {
        delete ret.security.apiSecret;
      }

      return ret;
    },
  }
);

const Settings =
  mongoose.model(
    "Settings",
    settingsSchema
  );

module.exports = Settings;
/******************************************************************************
 * models/NotificationPreference.js
 * Enterprise Notification Preference Model
 ******************************************************************************/

const mongoose = require("mongoose");

/* ==========================================================================
   Notification Preference Schema
========================================================================== */

const notificationPreferenceSchema = new mongoose.Schema(

    {

        userId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            unique: true,

            index: true,

        },

        desktop: {

            enabled: {

                type: Boolean,

                default: true,

            },

            sound: {

                type: Boolean,

                default: true,

            },

        },

        email: {

            enabled: {

                type: Boolean,

                default: true,

            },

            dailyDigest: {

                type: Boolean,

                default: false,

            },

            weeklyDigest: {

                type: Boolean,

                default: false,

            },

        },

        push: {

            enabled: {

                type: Boolean,

                default: true,

            },

            subscriptionId: {

                type: String,

                default: "",

            },

        },

        quietHours: {

            enabled: {

                type: Boolean,

                default: false,

            },

            startTime: {

                type: String,

                default: "22:00",

            },

            endTime: {

                type: String,

                default: "07:00",

            },

            timezone: {

                type: String,

                default: "Asia/Kolkata",

            },

        },

        priority: {

            high: {

                type: Boolean,

                default: true,

            },

            medium: {

                type: Boolean,

                default: true,

            },

            low: {

                type: Boolean,

                default: true,

            },

        },

        categories: {

            ai: {

                type: Boolean,

                default: true,

            },

            inbox: {

                type: Boolean,

                default: true,

            },

            task: {

                type: Boolean,

                default: true,

            },

            dashboard: {

                type: Boolean,

                default: true,

            },

            company: {

                type: Boolean,

                default: true,

            },

            security: {

                type: Boolean,

                default: true,

            },

            system: {

                type: Boolean,

                default: true,

            },

        },

        frequency: {

            type: String,

            enum: [

                "instant",

                "5min",

                "15min",

                "30min",

                "hourly",

            ],

            default: "instant",

        },

        lastUpdatedBy: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

        },

    },

    {

        timestamps: true,

        versionKey: false,

    }

);

/* ==========================================================================
   Indexes
========================================================================== */

notificationPreferenceSchema.index({

    userId: 1,

});

notificationPreferenceSchema.index({

    "quietHours.enabled": 1,

});

notificationPreferenceSchema.index({

    frequency: 1,

});

/* ==========================================================================
   Export
========================================================================== */

module.exports = mongoose.model(

    "NotificationPreference",

    notificationPreferenceSchema

);

/******************************************************************************
 * End models/NotificationPreference.js
 ******************************************************************************/
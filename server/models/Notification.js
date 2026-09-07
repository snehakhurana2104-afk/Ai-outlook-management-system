/******************************************************************************
 * models/Notification.js
 * Enterprise Notification Model
 ******************************************************************************/

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(

    {

        userId: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            index: true,

        },

        title: {

            type: String,

            required: true,

            trim: true,

            maxlength: 200,

        },

        message: {

            type: String,

            required: true,

            maxlength: 1000,

        },

        type: {

            type: String,

            enum: [

                "info",

                "success",

                "warning",

                "error",

                "ai",

                "email",

                "task",

                "system",

            ],

            default: "info",

        },

        category: {

            type: String,

            enum: [

                "dashboard",

                "analytics",

                "email",

                "task",

                "outlook",

                "security",

                "ai",

                "system",

            ],

            default: "system",

        },

        priority: {

            type: String,

            enum: [

                "low",

                "medium",

                "high",

                "critical",

            ],

            default: "medium",

        },

        isRead: {

            type: Boolean,

            default: false,

        },

        isArchived: {

            type: Boolean,

            default: false,

        },

        actionUrl: {

            type: String,

            default: "",

        },

        icon: {

            type: String,

            default: "bell",

        },

        metadata: {

            type: mongoose.Schema.Types.Mixed,

            default: {},

        },

        expiresAt: {

            type: Date,

            default: null,

        },

    },

    {

        timestamps: true,

    }

);

/******************************************************************************
 * Indexes
 ******************************************************************************/

notificationSchema.index({

    userId: 1,

    isRead: 1,

    createdAt: -1,

});

notificationSchema.index({

    userId: 1,

    category: 1,

});

notificationSchema.index({

    expiresAt: 1,

});

/******************************************************************************
 * Virtual
 ******************************************************************************/

notificationSchema.virtual("age").get(function () {

    return Date.now() - this.createdAt.getTime();

});

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = mongoose.model(

    "Notification",

    notificationSchema

);

/******************************************************************************
 * End models/Notification.js
 ******************************************************************************/
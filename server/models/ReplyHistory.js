/******************************************************************************
 * models/ReplyHistory.js
 * Part 1
 * Enterprise Reply History Model
 ******************************************************************************/

const mongoose = require("mongoose");

/* ==========================================================================
   Reply History Schema
========================================================================== */

const ReplyHistorySchema = new mongoose.Schema({

    emailId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Email",

        required: true,

        index: true,

    },

    userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true,

    },

    reply: {

        type: String,

        required: true,

        trim: true,

    },

    tone: {

        type: String,

        default: "Professional",

        trim: true,

    },

/******************************************************************************
 * Part 1 Ends
 ******************************************************************************/
/******************************************************************************
 * AI Metadata
 ******************************************************************************/

    confidence: {

        type: Number,

        default: 0,

        min: 0,

        max: 100,

    },

    summary: {

        type: String,

        default: "",

        trim: true,

    },

    sentiment: {

        type: String,

        enum: [

            "Positive",

            "Neutral",

            "Negative",

            "Unknown",

        ],

        default: "Unknown",

    },

    keywords: [

        {

            type: String,

            trim: true,

        }

    ],

    language: {

        type: String,

        default: "English",

        trim: true,

    },

/******************************************************************************
 * Part 2 Ends
 ******************************************************************************/
/******************************************************************************
 * Reply Status
 ******************************************************************************/

    status: {

        type: String,

        enum: [

            "Generated",

            "Sent",

            "Failed",

            "Draft",

        ],

        default: "Generated",

    },

    model: {

        type: String,

        default: "Rule-Based",

        trim: true,

    },

    responseTime: {

        type: Number,

        default: 0,

    },

    metadata: {

        type: mongoose.Schema.Types.Mixed,

        default: {},

    },

/******************************************************************************
 * Part 3 Ends
 ******************************************************************************/
/******************************************************************************
 * Audit Information
 ******************************************************************************/

    createdBy: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,

    },

    updatedBy: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null,

    },

}, {

    timestamps: true,

    versionKey: false,

});

/* ==========================================================================
   Indexes
========================================================================== */

ReplyHistorySchema.index({

    emailId: 1,

    createdAt: -1,

});

ReplyHistorySchema.index({

    userId: 1,

    createdAt: -1,

});

ReplyHistorySchema.index({

    status: 1,

});

/******************************************************************************
 * Part 4 Ends
 ******************************************************************************/
/******************************************************************************
 * Static Methods
 ******************************************************************************/

ReplyHistorySchema.statics.getHistoryByEmail = function (

    emailId

) {

    return this.find({

        emailId,

    })

    .sort({

        createdAt: -1,

    });

};


ReplyHistorySchema.statics.getHistoryByUser = function (

    userId

) {

    return this.find({

        userId,

    })

    .sort({

        createdAt: -1,

    });

};


/******************************************************************************
 * Export Model
 ******************************************************************************/

module.exports = mongoose.model(

    "ReplyHistory",

    ReplyHistorySchema

);


/******************************************************************************
 * End ReplyHistory.js
 ******************************************************************************/
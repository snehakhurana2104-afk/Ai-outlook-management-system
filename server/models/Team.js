"use strict";

const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember",
      },
    ],

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Archived"],
      default: "Active",
      index: true,
    },

    avatar: {
      type: String,
      trim: true,
      default: "",
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

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
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "teams",
  }
);

/* Prevent duplicate team names for same owner */
teamSchema.index(
  {
    owner: 1,
    name: 1,
  },
  {
    unique: true,
    name: "unique_team_name_per_owner",
  }
);

/* Faster member lookup */
teamSchema.index({
  members: 1,
});

/* Tenant + owner lookup */
teamSchema.index({
  tenantId: 1,
  owner: 1,
});

/* JSON response */
teamSchema.set("toJSON", {
  virtuals: true,

  transform: function (doc, ret) {
    ret.id = ret._id
      ? String(ret._id)
      : null;

    delete ret._id;

    return ret;
  },
});

module.exports =
  mongoose.models.Team ||
  mongoose.model("Team", teamSchema);
/**
 * ============================================================================
 * TeamMember.js
 * Enterprise Team Member Model
 * ============================================================================
 *
 * Compatible with:
 *  - teamService.js
 *  - teamController.js
 *  - teamRoutes.js
 *
 * Responsibilities:
 *  - Store team members
 *  - Prevent duplicate members inside same team
 *  - Role validation
 *  - Member status validation
 *  - Team reference
 *  - Audit information
 * ============================================================================
 */

"use strict";

const mongoose = require("mongoose");

/* ============================================================================
 * Constants
 * ========================================================================== */

const VALID_ROLES = Object.freeze([
    "Owner",
    "Admin",
    "Manager",
    "Member",
    "Viewer",
]);

const VALID_STATUSES = Object.freeze([
    "Active",
    "Inactive",
    "Pending",
    "Suspended",
]);

/* ============================================================================
 * Team Member Schema
 * ========================================================================== */

const teamMemberSchema = new mongoose.Schema(
    {
        /* --------------------------------------------------------------------
         * Team Reference
         * ------------------------------------------------------------------ */

        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: [true, "Team is required"],
            index: true,
        },

        /* --------------------------------------------------------------------
         * User Reference
         *
         * Optional because your current API can create members using
         * name + email without an existing User model.
         * ------------------------------------------------------------------ */

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        /* --------------------------------------------------------------------
         * Member Name
         * ------------------------------------------------------------------ */

        name: {
            type: String,
            required: [true, "Member name is required"],
            trim: true,
            maxlength: 150,
        },

        /* --------------------------------------------------------------------
         * Email
         * ------------------------------------------------------------------ */

        email: {
            type: String,
            required: [true, "Member email is required"],
            trim: true,
            lowercase: true,
            maxlength: 254,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please provide a valid email address",
            ],
        },

        /* --------------------------------------------------------------------
         * Role
         * ------------------------------------------------------------------ */

        role: {
            type: String,
            enum: {
                values: VALID_ROLES,
                message: "Invalid team member role",
            },
            default: "Member",
            required: true,
            index: true,
        },

        /* --------------------------------------------------------------------
         * Status
         * ------------------------------------------------------------------ */

        status: {
            type: String,
            enum: {
                values: VALID_STATUSES,
                message: "Invalid team member status",
            },
            default: "Active",
            required: true,
            index: true,
        },

        /* --------------------------------------------------------------------
         * Job Title
         * ------------------------------------------------------------------ */

        title: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Department
         * ------------------------------------------------------------------ */

        department: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Avatar
         * ------------------------------------------------------------------ */

        avatar: {
            type: String,
            trim: true,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Phone
         * ------------------------------------------------------------------ */

        phone: {
            type: String,
            trim: true,
            maxlength: 30,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Designation
         * ------------------------------------------------------------------ */

        designation: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Employee ID
         * ------------------------------------------------------------------ */

        employeeId: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Microsoft 365 / Outlook Information
         * ------------------------------------------------------------------ */

        microsoftUserId: {
            type: String,
            trim: true,
            default: "",
            index: true,
        },

        outlookEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
        },

        /* --------------------------------------------------------------------
         * Audit Fields
         * ------------------------------------------------------------------ */

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

        /* --------------------------------------------------------------------
         * Soft Delete Support
         * ------------------------------------------------------------------ */

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        deletedAt: {
            type: Date,
            default: null,
        },

        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,

        versionKey: false,

        collection: "team_members",
    }
);

/* ============================================================================
 * Indexes
 * ========================================================================== */

/**
 * Prevent duplicate email inside the same team.
 *
 * Example:
 *
 * team A + abc@company.com  -> allowed
 * team A + abc@company.com  -> NOT allowed
 * team B + abc@company.com  -> allowed
 */
teamMemberSchema.index(
    {
        team: 1,
        email: 1,
    },
    {
        unique: true,
        name: "unique_team_member_email",
    }
);

/**
 * Faster team member queries.
 */
teamMemberSchema.index({
    team: 1,
    role: 1,
    status: 1,
});

/**
 * Faster member searching.
 */
teamMemberSchema.index({
    team: 1,
    name: 1,
});

/* ============================================================================
 * Normalize Email Before Validation / Save
 * ========================================================================== */

teamMemberSchema.pre(
    "validate",
    function (next) {
        if (this.email) {
            this.email = String(
                this.email
            )
                .trim()
                .toLowerCase();
        }

        if (this.outlookEmail) {
            this.outlookEmail = String(
                this.outlookEmail
            )
                .trim()
                .toLowerCase();
        }

        if (this.name) {
            this.name = String(
                this.name
            ).trim();
        }

        next();
    }
);

/* ============================================================================
 * JSON Transformation
 * ========================================================================== */

teamMemberSchema.set(
    "toJSON",
    {
        virtuals: true,

        transform: function (
            doc,
            ret
        ) {
            ret.id =
                ret._id
                    ? String(ret._id)
                    : null;

            if (ret.team) {
                if (
                    typeof ret.team ===
                    "object"
                ) {
                    ret.teamId =
                        ret.team._id
                            ? String(
                                  ret.team._id
                              )
                            : ret.team;
                } else {
                    ret.teamId =
                        String(
                            ret.team
                        );
                }
            }

            delete ret._id;

            return ret;
        },
    }
);

/* ============================================================================
 * Static Helpers
 * ========================================================================== */

/**
 * Find member by email inside a team.
 */
teamMemberSchema.statics.findByTeamAndEmail =
    function (
        teamId,
        email
    ) {
        return this.findOne({
            team: teamId,
            email: String(
                email
            )
                .trim()
                .toLowerCase(),
        });
    };

/**
 * Check whether member already exists.
 */
teamMemberSchema.statics.isMemberExists =
    async function (
        teamId,
        email
    ) {
        const member =
            await this.findOne({
                team: teamId,
                email: String(
                    email
                )
                    .trim()
                    .toLowerCase(),
            })
                .select("_id")
                .lean();

        return Boolean(
            member
        );
    };

/**
 * Get active members.
 */
teamMemberSchema.statics.getActiveMembers =
    function (
        teamId
    ) {
        return this.find({
            team: teamId,
            status: "Active",
            isDeleted: false,
        }).sort({
            createdAt: 1,
        });
    };

/**
 * Get members by role.
 */
teamMemberSchema.statics.getMembersByRole =
    function (
        teamId,
        role
    ) {
        return this.find({
            team: teamId,
            role,
            isDeleted: false,
        }).sort({
            createdAt: 1,
        });
    };

/* ============================================================================
 * Instance Helpers
 * ========================================================================== */

/**
 * Soft delete member.
 */
teamMemberSchema.methods.softDelete =
    async function (
        deletedBy = null
    ) {
        this.isDeleted = true;
        this.deletedAt =
            new Date();
        this.deletedBy =
            deletedBy;
        this.status =
            "Inactive";

        return this.save();
    };

/**
 * Restore member.
 */
teamMemberSchema.methods.restore =
    async function () {
        this.isDeleted = false;
        this.deletedAt = null;
        this.deletedBy = null;
        this.status = "Active";

        return this.save();
    };

/* ============================================================================
 * Model
 * ========================================================================== */

const TeamMember =
    mongoose.models.TeamMember ||
    mongoose.model(
        "TeamMember",
        teamMemberSchema
    );

/* ============================================================================
 * Exports
 * ========================================================================== */

module.exports = TeamMember;

module.exports.TeamMember =
    TeamMember;

module.exports.VALID_ROLES =
    VALID_ROLES;

module.exports.VALID_STATUSES =
    VALID_STATUSES;

/* ============================================================================
 * End TeamMember.js
 * ========================================================================== */
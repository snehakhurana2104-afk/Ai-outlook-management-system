/**
 * ============================================================================
 * User.js
 * Phase 9.2 — Enterprise Team Member Model
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 * - Team member identity
 * - Microsoft 365 / Entra ID mapping
 * - Role-based access control
 * - Department/team information
 * - Active/inactive state
 * - Manager relationship
 * - Performance statistics
 * - User preferences
 * - Secure audit metadata
 *
 * Roles:
 * - Admin
 * - Manager
 * - User
 * ============================================================================
 */

const mongoose = require("mongoose");

/* ============================================================================
Constants
============================================================================ */

const USER_ROLES = Object.freeze([
    "Admin",
    "Manager",
    "User",
]);

const USER_STATUS = Object.freeze([
    "Active",
    "Inactive",
    "Pending",
    "Suspended",
]);

const DEFAULT_ROLE = "User";
const DEFAULT_STATUS = "Pending";

/* ============================================================================
Performance Sub-Schema
============================================================================ */

const performanceSchema = new mongoose.Schema(
    {
        emailsHandled: {
            type: Number,
            default: 0,
            min: 0,
        },

        emailsReplied: {
            type: Number,
            default: 0,
            min: 0,
        },

        tasksCompleted: {
            type: Number,
            default: 0,
            min: 0,
        },

        tasksPending: {
            type: Number,
            default: 0,
            min: 0,
        },

        slaCompleted: {
            type: Number,
            default: 0,
            min: 0,
        },

        slaBreached: {
            type: Number,
            default: 0,
            min: 0,
        },

        averageResponseTime: {
            type: Number,
            default: 0,
            min: 0,
        },

        performanceScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        responseRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        lastCalculatedAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================================
Preferences Sub-Schema
============================================================================ */

const preferencesSchema = new mongoose.Schema(
    {
        theme: {
            type: String,
            enum: [
                "light",
                "dark",
                "system",
            ],
            default: "system",
        },

        language: {
            type: String,
            default: "en",
            trim: true,
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata",
            trim: true,
        },

        emailSyncEnabled: {
            type: Boolean,
            default: true,
        },

        autoRefreshEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================================
User Schema
============================================================================ */

const userSchema = new mongoose.Schema(
    {
        /* --------------------------------------------------------------------
        Identity
        -------------------------------------------------------------------- */

        firstName: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 100,
        },

        lastName: {
            type: String,
            default: "",
            trim: true,
            maxlength: 100,
        },

        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 320,
            index: true,
        },

        phone: {
            type: String,
            default: "",
            trim: true,
            maxlength: 30,
        },

        jobTitle: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150,
        },

        /* --------------------------------------------------------------------
        Microsoft 365 / Entra ID
        -------------------------------------------------------------------- */

        microsoftUserId: {
            type: String,
            default: null,
            sparse: true,
            index: true,
        },

        tenantId: {
            type: String,
            default: null,
            index: true,
        },

        microsoftObjectId: {
            type: String,
            default: null,
            sparse: true,
            index: true,
        },

        microsoftAccountEnabled: {
            type: Boolean,
            default: true,
        },

        /* --------------------------------------------------------------------
        Organization
        -------------------------------------------------------------------- */

        department: {
            type: String,
            default: "General",
            trim: true,
            maxlength: 150,
            index: true,
        },

        team: {
            type: String,
            default: "General",
            trim: true,
            maxlength: 150,
            index: true,
        },

        location: {
            type: String,
            default: "",
            trim: true,
            maxlength: 150,
        },

        employeeId: {
            type: String,
            default: null,
            sparse: true,
            trim: true,
            maxlength: 100,
            index: true,
        },

        /* --------------------------------------------------------------------
        Role & Access
        -------------------------------------------------------------------- */

        role: {
            type: String,
            enum: USER_ROLES,
            default: DEFAULT_ROLE,
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: USER_STATUS,
            default: DEFAULT_STATUS,
            required: true,
            index: true,
        },

        /* --------------------------------------------------------------------
        Manager Relationship
        -------------------------------------------------------------------- */

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        /* --------------------------------------------------------------------
        Account State
        -------------------------------------------------------------------- */

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        /* --------------------------------------------------------------------
        Profile
        -------------------------------------------------------------------- */

        avatar: {
            type: String,
            default: "",
            trim: true,
        },

        /* --------------------------------------------------------------------
        Performance
        -------------------------------------------------------------------- */

        performance: {
            type: performanceSchema,
            default: () => ({}),
        },

        /* --------------------------------------------------------------------
        Preferences
        -------------------------------------------------------------------- */

        preferences: {
            type: preferencesSchema,
            default: () => ({}),
        },

        /* --------------------------------------------------------------------
        Activity
        -------------------------------------------------------------------- */

        lastLoginAt: {
            type: Date,
            default: null,
        },

        lastActiveAt: {
            type: Date,
            default: null,
        },

        invitedAt: {
            type: Date,
            default: null,
        },

        joinedAt: {
            type: Date,
            default: null,
        },

        deactivatedAt: {
            type: Date,
            default: null,
        },

        /* --------------------------------------------------------------------
        Audit
        -------------------------------------------------------------------- */

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

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,

        versionKey: false,

        strict: true,

        collection: "users",
    }
);

/* ============================================================================
Indexes
============================================================================ */

/*
 * Important compound indexes for Team Management.
 */

userSchema.index({
    status: 1,
    isActive: 1,
});

userSchema.index({
    role: 1,
    status: 1,
});

userSchema.index({
    department: 1,
    team: 1,
});

userSchema.index({
    manager: 1,
    status: 1,
});

userSchema.index({
    tenantId: 1,
    microsoftUserId: 1,
});

/* ============================================================================
Virtuals
============================================================================ */

/*
 * Full display name.
 */

userSchema.virtual("fullName").get(function () {
    return [this.firstName, this.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
});

/*
 * Whether the member is currently available.
 */

userSchema.virtual("isAvailable").get(function () {
    return (
        this.isActive === true &&
        this.status === "Active" &&
        this.isDeleted !== true
    );
});

/* ============================================================================
JSON Serialization
============================================================================ */

userSchema.set(
    "toJSON",
    {
        virtuals: true,

        transform: (doc, ret) => {
            delete ret.__v;

            return ret;
        },
    }
);

/* ============================================================================
Query Helpers
============================================================================ */

/*
 * Only active users.
 */

userSchema.query.active = function () {
    return this.where({
        isActive: true,
        isDeleted: false,
        status: "Active",
    });
};

/*
 * Only non-deleted users.
 */

userSchema.query.notDeleted = function () {
    return this.where({
        isDeleted: false,
    });
};

/*
 * Find users belonging to a department.
 */

userSchema.query.byDepartment = function (
    department
) {
    return this.where({
        department,
        isDeleted: false,
    });
};

/*
 * Find users belonging to a team.
 */

userSchema.query.byTeam = function (
    team
) {
    return this.where({
        team,
        isDeleted: false,
    });
};

/* ============================================================================
Static Methods
============================================================================ */

/*
 * Find active team members.
 */

userSchema.statics.findActiveMembers =
    function () {
        return this.find({
            isActive: true,
            isDeleted: false,
            status: "Active",
        }).sort({
            displayName: 1,
        });
    };

/*
 * Find users by role.
 */

userSchema.statics.findByRole =
    function (role) {
        return this.find({
            role,
            isDeleted: false,
        }).sort({
            displayName: 1,
        });
    };

/*
 * Find members managed by a manager.
 */

userSchema.statics.findByManager =
    function (managerId) {
        return this.find({
            manager: managerId,
            isDeleted: false,
        }).sort({
            displayName: 1,
        });
    };

/* ============================================================================
Instance Methods
============================================================================ */

/*
 * Soft delete user.
 */

userSchema.methods.softDelete =
    async function () {
        this.isDeleted = true;
        this.isActive = false;
        this.status = "Inactive";
        this.deletedAt = new Date();
        this.deactivatedAt = new Date();

        return this.save();
    };

/*
 * Activate user.
 */

userSchema.methods.activate =
    async function () {
        this.isDeleted = false;
        this.isActive = true;
        this.status = "Active";

        if (!this.joinedAt) {
            this.joinedAt = new Date();
        }

        return this.save();
    };

/*
 * Deactivate user.
 */

userSchema.methods.deactivate =
    async function () {
        this.isActive = false;
        this.status = "Inactive";
        this.deactivatedAt = new Date();

        return this.save();
    };

/* ============================================================================
Validation
============================================================================ */

/*
 * Prevent invalid performance values.
 */

userSchema.pre(
    "save",
    function (next) {
        if (
            this.performance
                ?.performanceScore > 100
        ) {
            this.performance.performanceScore = 100;
        }

        if (
            this.performance
                ?.performanceScore < 0
        ) {
            this.performance.performanceScore = 0;
        }

        if (
            this.performance
                ?.responseRate > 100
        ) {
            this.performance.responseRate = 100;
        }

        if (
            this.performance
                ?.responseRate < 0
        ) {
            this.performance.responseRate = 0;
        }

        next();
    }
);

/* ============================================================================
Model
============================================================================ */

const User =
    mongoose.models.User ||
    mongoose.model(
        "User",
        userSchema
    );

/* ============================================================================
Exports
============================================================================ */

module.exports = User;

module.exports.USER_ROLES =
    USER_ROLES;

module.exports.USER_STATUS =
    USER_STATUS;

/**
 * ============================================================================
 * End User.js
 * ============================================================================
 */
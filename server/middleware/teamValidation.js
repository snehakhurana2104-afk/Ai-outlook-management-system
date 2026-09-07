/**
 * ============================================================================
 * teamValidation.js
 * Phase 9.6 — Enterprise Team Validation
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 * - Validate team requests
 * - Validate team IDs
 * - Validate member IDs
 * - Validate member payloads
 * - Validate team payloads
 * - Prevent unsafe fields
 * - Normalize input
 * - Protect against malformed requests
 * - Provide consistent validation responses
 * ============================================================================
 */

"use strict";

const mongoose = require("mongoose");

/* ==========================================================================
   Constants
   ========================================================================== */

const MAX_TEAM_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const MAX_MEMBER_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

const ALLOWED_ROLES = Object.freeze([
    "Owner",
    "Admin",
    "Manager",
    "Member",
    "Viewer",
]);

const ALLOWED_TEAM_STATUS = Object.freeze([
    "Active",
    "Inactive",
    "Archived",
]);

const ALLOWED_MEMBER_STATUS = Object.freeze([
    "Active",
    "Inactive",
    "Pending",
]);

const EMAIL_REGEX =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ==========================================================================
   Response Helper
   ========================================================================== */

const validationError = (
    res,
    message,
    details = []
) => {
    return res.status(400).json({
        success: false,

        message,

        code: "TEAM_VALIDATION_ERROR",

        data: {
            details,
        },

        timestamp:
            new Date().toISOString(),
    });
};

/* ==========================================================================
   Generic String Validator
   ========================================================================== */

const isValidString = (
    value,
    maxLength
) => {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.trim().length <= maxLength
    );
};

/* ==========================================================================
   Object ID Validator
   ========================================================================== */

const isValidObjectId = (
    value
) => {
    return (
        typeof value === "string" &&
        mongoose.Types.ObjectId.isValid(
            value
        )
    );
};

/* ==========================================================================
   Email Validator
   ========================================================================== */

const isValidEmail = (
    email
) => {
    if (
        typeof email !== "string"
    ) {
        return false;
    }

    const normalized =
        email.trim().toLowerCase();

    return (
        normalized.length <=
            MAX_EMAIL_LENGTH &&
        EMAIL_REGEX.test(
            normalized
        )
    );
};

/* ==========================================================================
   Normalize Email
   ========================================================================== */

const normalizeEmail = (
    email
) => {
    if (
        typeof email !== "string"
    ) {
        return "";
    }

    return email
        .trim()
        .toLowerCase();
};

/* ==========================================================================
   Normalize Role
   ========================================================================== */

const normalizeRole = (
    role
) => {
    if (
        typeof role !== "string"
    ) {
        return "Member";
    }

    const normalized =
        role.trim().toLowerCase();

    return (
        ALLOWED_ROLES.find(
            (item) =>
                item.toLowerCase() ===
                normalized
        ) || null
    );
};

/* ==========================================================================
   Validate Team ID
   ========================================================================== */

const validateTeamId = (
    req,
    res,
    next
) => {
    const { teamId } =
        req.params;

    if (
        !isValidObjectId(teamId)
    ) {
        return validationError(
            res,
            "Invalid team ID.",
            [
                {
                    field: "teamId",
                    message:
                        "teamId must be a valid MongoDB ObjectId.",
                },
            ]
        );
    }

    next();
};

/* ==========================================================================
   Validate Member ID
   ========================================================================== */

const validateMemberId = (
    req,
    res,
    next
) => {
    const { memberId } =
        req.params;

    if (
        !isValidObjectId(
            memberId
        )
    ) {
        return validationError(
            res,
            "Invalid member ID.",
            [
                {
                    field: "memberId",
                    message:
                        "memberId must be a valid MongoDB ObjectId.",
                },
            ]
        );
    }

    next();
};

/* ==========================================================================
   Validate Team Create
   ========================================================================== */

const validateCreateTeam = (
    req,
    res,
    next
) => {
    const {
        name,
        description,
        status,
    } = req.body || {};

    const errors = [];

    if (
        !isValidString(
            name,
            MAX_TEAM_NAME_LENGTH
        )
    ) {
        errors.push({
            field: "name",
            message:
                `Team name is required and must be between 1 and ${MAX_TEAM_NAME_LENGTH} characters.`,
        });
    }

    if (
        description !== undefined &&
        description !== null &&
        (
            typeof description !==
                "string" ||
            description.length >
                MAX_DESCRIPTION_LENGTH
        )
    ) {
        errors.push({
            field: "description",
            message:
                `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        });
    }

    if (
        status !== undefined &&
        !ALLOWED_TEAM_STATUS.includes(
            status
        )
    ) {
        errors.push({
            field: "status",
            message:
                `Status must be one of: ${ALLOWED_TEAM_STATUS.join(", ")}.`,
        });
    }

    if (errors.length > 0) {
        return validationError(
            res,
            "Invalid team data.",
            errors
        );
    }

    req.body.name =
        name.trim();

    if (
        typeof description ===
        "string"
    ) {
        req.body.description =
            description.trim();
    }

    if (
        status === undefined
    ) {
        req.body.status =
            "Active";
    }

    next();
};

/* ==========================================================================
   Validate Team Update
   ========================================================================== */

const validateUpdateTeam = (
    req,
    res,
    next
) => {
    const body =
        req.body || {};

    const errors = [];

    const allowedFields = [
        "name",
        "description",
        "status",
    ];

    const receivedFields =
        Object.keys(body);

    const unexpectedFields =
        receivedFields.filter(
            (field) =>
                !allowedFields.includes(
                    field
                )
        );

    if (
        unexpectedFields.length > 0
    ) {
        errors.push({
            field: "body",
            message:
                `Unsupported fields: ${unexpectedFields.join(", ")}.`,
        });
    }

    if (
        body.name !== undefined &&
        !isValidString(
            body.name,
            MAX_TEAM_NAME_LENGTH
        )
    ) {
        errors.push({
            field: "name",
            message:
                `Team name must be between 1 and ${MAX_TEAM_NAME_LENGTH} characters.`,
        });
    }

    if (
        body.description !==
            undefined &&
        body.description !==
            null &&
        (
            typeof body.description !==
                "string" ||
            body.description.length >
                MAX_DESCRIPTION_LENGTH
        )
    ) {
        errors.push({
            field: "description",
            message:
                `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        });
    }

    if (
        body.status !== undefined &&
        !ALLOWED_TEAM_STATUS.includes(
            body.status
        )
    ) {
        errors.push({
            field: "status",
            message:
                `Status must be one of: ${ALLOWED_TEAM_STATUS.join(", ")}.`,
        });
    }

    if (
        receivedFields.length === 0
    ) {
        errors.push({
            field: "body",
            message:
                "At least one update field is required.",
        });
    }

    if (errors.length > 0) {
        return validationError(
            res,
            "Invalid team update.",
            errors
        );
    }

    if (
        typeof body.name ===
        "string"
    ) {
        body.name =
            body.name.trim();
    }

    if (
        typeof body.description ===
        "string"
    ) {
        body.description =
            body.description.trim();
    }

    next();
};

/* ==========================================================================
   Validate Add Member
   ========================================================================== */

const validateAddTeamMember = (
    req,
    res,
    next
) => {
    const {
        name,
        email,
        role,
        status,
    } = req.body || {};

    const errors = [];

    if (
        !isValidString(
            name,
            MAX_MEMBER_NAME_LENGTH
        )
    ) {
        errors.push({
            field: "name",
            message:
                `Member name is required and must not exceed ${MAX_MEMBER_NAME_LENGTH} characters.`,
        });
    }

    if (
        !isValidEmail(email)
    ) {
        errors.push({
            field: "email",
            message:
                "A valid email address is required.",
        });
    }

    const normalizedRole =
        normalizeRole(role);

    if (
        !normalizedRole
    ) {
        errors.push({
            field: "role",
            message:
                `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`,
        });
    }

    if (
        status !== undefined &&
        !ALLOWED_MEMBER_STATUS.includes(
            status
        )
    ) {
        errors.push({
            field: "status",
            message:
                `Status must be one of: ${ALLOWED_MEMBER_STATUS.join(", ")}.`,
        });
    }

    if (errors.length > 0) {
        return validationError(
            res,
            "Invalid team member data.",
            errors
        );
    }

    req.body.name =
        name.trim();

    req.body.email =
        normalizeEmail(email);

    req.body.role =
        normalizedRole;

    if (
        status === undefined
    ) {
        req.body.status =
            "Active";
    }

    next();
};

/* ==========================================================================
   Validate Member Update
   ========================================================================== */

const validateUpdateTeamMember = (
    req,
    res,
    next
) => {
    const body =
        req.body || {};

    const errors = [];

    const allowedFields = [
        "name",
        "email",
        "role",
        "status",
    ];

    const receivedFields =
        Object.keys(body);

    const unexpectedFields =
        receivedFields.filter(
            (field) =>
                !allowedFields.includes(
                    field
                )
        );

    if (
        unexpectedFields.length > 0
    ) {
        errors.push({
            field: "body",
            message:
                `Unsupported fields: ${unexpectedFields.join(", ")}.`,
        });
    }

    if (
        body.name !== undefined &&
        !isValidString(
            body.name,
            MAX_MEMBER_NAME_LENGTH
        )
    ) {
        errors.push({
            field: "name",
            message:
                `Member name must not exceed ${MAX_MEMBER_NAME_LENGTH} characters.`,
        });
    }

    if (
        body.email !== undefined &&
        !isValidEmail(
            body.email
        )
    ) {
        errors.push({
            field: "email",
            message:
                "A valid email address is required.",
        });
    }

    if (
        body.role !== undefined
    ) {
        const normalizedRole =
            normalizeRole(
                body.role
            );

        if (
            !normalizedRole
        ) {
            errors.push({
                field: "role",
                message:
                    `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`,
            });
        } else {
            body.role =
                normalizedRole;
        }
    }

    if (
        body.status !== undefined &&
        !ALLOWED_MEMBER_STATUS.includes(
            body.status
        )
    ) {
        errors.push({
            field: "status",
            message:
                `Status must be one of: ${ALLOWED_MEMBER_STATUS.join(", ")}.`,
        });
    }

    if (
        receivedFields.length === 0
    ) {
        errors.push({
            field: "body",
            message:
                "At least one member update field is required.",
        });
    }

    if (errors.length > 0) {
        return validationError(
            res,
            "Invalid member update.",
            errors
        );
    }

    if (
        typeof body.name ===
        "string"
    ) {
        body.name =
            body.name.trim();
    }

    if (
        typeof body.email ===
        "string"
    ) {
        body.email =
            normalizeEmail(
                body.email
            );
    }

    next();
};

/* ==========================================================================
   Prevent Query Pollution
   ========================================================================== */

const sanitizeQuery = (
    req,
    res,
    next
) => {
    const query =
        req.query || {};

    for (
        const key of Object.keys(
            query
        )
    ) {
        if (
            key.startsWith("$") ||
            key.includes(".")
        ) {
            return validationError(
                res,
                "Invalid query parameters.",
                [
                    {
                        field: key,
                        message:
                            "Unsafe query parameter.",
                    },
                ]
            );
        }
    }

    next();
};

/* ==========================================================================
   Prevent Body Operator Injection
   ========================================================================== */

const sanitizeBody = (
    req,
    res,
    next
) => {
    const body =
        req.body || {};

    const hasUnsafeKey = (
        value
    ) => {
        if (
            !value ||
            typeof value !==
                "object"
        ) {
            return false;
        }

        for (
            const key of Object.keys(
                value
            )
        ) {
            if (
                key.startsWith("$") ||
                key.includes(".")
            ) {
                return true;
            }

            if (
                typeof value[key] ===
                    "object" &&
                value[key] !== null &&
                hasUnsafeKey(
                    value[key]
                )
            ) {
                return true;
            }
        }

        return false;
    };

    if (
        hasUnsafeKey(body)
    ) {
        return validationError(
            res,
            "Unsafe request payload.",
            [
                {
                    field: "body",
                    message:
                        "MongoDB operator or dotted keys are not allowed.",
                },
            ]
        );
    }

    next();
};

/* ==========================================================================
   Exports
   ========================================================================== */

module.exports = {
    validateTeamId,
    validateMemberId,

    validateCreateTeam,
    validateUpdateTeam,

    validateAddTeamMember,
    validateUpdateTeamMember,

    sanitizeQuery,
    sanitizeBody,

    isValidObjectId,
    isValidEmail,
    normalizeEmail,
    normalizeRole,
};

/**
 * ============================================================================
 * End teamValidation.js
 * ============================================================================
 */
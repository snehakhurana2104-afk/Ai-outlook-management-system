/**
 * ============================================================================
 * validate.js
 * Enterprise Request Validation Middleware
 * ============================================================================
 *
 * Compatible with:
 *  - mailRoutes.js
 *  - outlookRoutes.js
 *  - auth routes
 *  - Team routes
 *
 * Usage:
 *
 *   validate("emailId")
 *   validate("teamId")
 *   validate("memberId")
 *
 * The middleware validates route parameters and prevents malformed requests
 * from reaching controllers.
 * ============================================================================
 */

"use strict";

const mongoose = require("mongoose");

/* ============================================================================
 * Constants
 * ========================================================================== */

const MODULE_NAME = "ValidationMiddleware";

/* ============================================================================
 * ObjectId Validation
 * ========================================================================== */

const isValidObjectId = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return false;
    }

    return mongoose.Types.ObjectId.isValid(
        String(value)
    );
};

/* ============================================================================
 * Email Validation
 * ========================================================================== */

const isValidEmail = (value) => {
    if (!value) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(value).trim()
    );
};

/* ============================================================================
 * Generic String Validation
 * ========================================================================== */

const isValidString = (
    value,
    minLength = 1,
    maxLength = 500
) => {
    if (
        value === undefined ||
        value === null
    ) {
        return false;
    }

    const stringValue =
        String(value).trim();

    return (
        stringValue.length >= minLength &&
        stringValue.length <= maxLength
    );
};

/* ============================================================================
 * UUID Validation
 * ========================================================================== */

const isValidUUID = (value) => {
    if (!value) {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        String(value)
    );
};

/* ============================================================================
 * Mongo ID Parameter Validator
 * ========================================================================== */

const validateMongoParameter = (
    req,
    res,
    parameter
) => {
    const value =
        req.params?.[parameter];

    if (!value) {
        return res.status(400).json({
            success: false,
            message:
                `${parameter} is required.`,
            code:
                "PARAMETER_REQUIRED",
            parameter,
            timestamp:
                new Date().toISOString(),
        });
    }

    if (
        !isValidObjectId(value)
    ) {
        return res.status(400).json({
            success: false,
            message:
                `Invalid ${parameter}.`,
            code:
                "INVALID_OBJECT_ID",
            parameter,
            timestamp:
                new Date().toISOString(),
        });
    }

    return null;
};

/* ============================================================================
 * Email ID Validator
 *
 * IMPORTANT
 * --------------------------------------------------------------------------
 * emailId may be:
 *
 *  1. MongoDB ObjectId
 *  2. Microsoft Graph message ID
 *  3. Custom application email ID
 *
 * Therefore we should NOT force emailId to be MongoDB ObjectId.
 * ============================================================================
 */

const validateEmailId = (
    req,
    res
) => {
    const emailId =
        req.params?.emailId;

    if (
        emailId === undefined ||
        emailId === null ||
        String(emailId).trim() === ""
    ) {
        return res.status(400).json({
            success: false,
            message:
                "emailId is required.",
            code:
                "EMAIL_ID_REQUIRED",
            parameter:
                "emailId",
            timestamp:
                new Date().toISOString(),
        });
    }

    const normalized =
        String(emailId).trim();

    /*
     * Prevent extremely large IDs.
     */
    if (
        normalized.length > 2048
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Invalid emailId.",
            code:
                "INVALID_EMAIL_ID",
            parameter:
                "emailId",
            timestamp:
                new Date().toISOString(),
        });
    }

    /*
     * Remove surrounding whitespace.
     */
    req.params.emailId =
        normalized;

    return null;
};

/* ============================================================================
 * Member ID Validator
 * ========================================================================== */

const validateMemberId = (
    req,
    res
) => {
    return validateMongoParameter(
        req,
        res,
        "memberId"
    );
};

/* ============================================================================
 * Team ID Validator
 * ========================================================================== */

const validateTeamId = (
    req,
    res
) => {
    return validateMongoParameter(
        req,
        res,
        "teamId"
    );
};

/* ============================================================================
 * ID Validator
 * ========================================================================== */

const validateId = (
    req,
    res
) => {
    return validateMongoParameter(
        req,
        res,
        "id"
    );
};

/* ============================================================================
 * User ID Validator
 * ========================================================================== */

const validateUserId = (
    req,
    res
) => {
    return validateMongoParameter(
        req,
        res,
        "userId"
    );
};

/* ============================================================================
 * Query Sanitization
 * ========================================================================== */

const sanitizeQuery = (
    req,
    res,
    next
) => {
    try {
        if (
            !req.query ||
            typeof req.query !== "object"
        ) {
            return next();
        }

        Object.keys(
            req.query
        ).forEach((key) => {
            const value =
                req.query[key];

            if (
                typeof value ===
                "string"
            ) {
                req.query[key] =
                    value.trim();
            }
        });

        return next();
    } catch (error) {
        console.error(
            `[${MODULE_NAME}] Query sanitization error:`,
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                "Invalid query parameters.",
            code:
                "INVALID_QUERY",
            timestamp:
                new Date().toISOString(),
        });
    }
};

/* ============================================================================
 * Body Sanitization
 * ========================================================================== */

const sanitizeBody = (
    req,
    res,
    next
) => {
    try {
        if (
            !req.body ||
            typeof req.body !== "object"
        ) {
            return next();
        }

        /*
         * Do not recursively modify objects.
         *
         * We only trim top-level string values.
         */
        Object.keys(
            req.body
        ).forEach((key) => {
            const value =
                req.body[key];

            if (
                typeof value ===
                "string"
            ) {
                req.body[key] =
                    value.trim();
            }
        });

        return next();
    } catch (error) {
        console.error(
            `[${MODULE_NAME}] Body sanitization error:`,
            error.message
        );

        return res.status(400).json({
            success: false,
            message:
                "Invalid request body.",
            code:
                "INVALID_REQUEST_BODY",
            timestamp:
                new Date().toISOString(),
        });
    }
};

/* ============================================================================
 * Validation Factory
 *
 * Usage:
 *
 * validate("emailId")
 * validate("teamId")
 * validate("memberId")
 * ============================================================================
 */

const validate = (
    parameter
) => {
    return (req, res, next) => {
        try {
            const field =
                String(
                    parameter || ""
                ).trim();

            if (!field) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Validation parameter is missing.",
                    code:
                        "VALIDATION_PARAMETER_MISSING",
                    timestamp:
                        new Date().toISOString(),
                });
            }

            /* --------------------------------------------------------------
             * emailId
             * ------------------------------------------------------------ */

            if (
                field ===
                "emailId"
            ) {
                const error =
                    validateEmailId(
                        req,
                        res
                    );

                if (error) {
                    return error;
                }

                return next();
            }

            /* --------------------------------------------------------------
             * teamId
             * ------------------------------------------------------------ */

            if (
                field ===
                "teamId"
            ) {
                const error =
                    validateTeamId(
                        req,
                        res
                    );

                if (error) {
                    return error;
                }

                return next();
            }

            /* --------------------------------------------------------------
             * memberId
             * ------------------------------------------------------------ */

            if (
                field ===
                "memberId"
            ) {
                const error =
                    validateMemberId(
                        req,
                        res
                    );

                if (error) {
                    return error;
                }

                return next();
            }

            /* --------------------------------------------------------------
             * userId
             * ------------------------------------------------------------ */

            if (
                field ===
                "userId"
            ) {
                const error =
                    validateUserId(
                        req,
                        res
                    );

                if (error) {
                    return error;
                }

                return next();
            }

            /* --------------------------------------------------------------
             * Generic Mongo ID
             * ------------------------------------------------------------ */

            if (
                field ===
                "id"
            ) {
                const error =
                    validateId(
                        req,
                        res
                    );

                if (error) {
                    return error;
                }

                return next();
            }

            /* --------------------------------------------------------------
             * Generic parameter
             *
             * For unknown parameters, only check that the parameter exists.
             * This keeps the middleware compatible with future routes.
             * ------------------------------------------------------------ */

            const value =
                req.params?.[field];

            if (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${field} is required.`,
                    code:
                        "PARAMETER_REQUIRED",
                    parameter:
                        field,
                    timestamp:
                        new Date().toISOString(),
                });
            }

            req.params[field] =
                String(value).trim();

            return next();

        } catch (error) {
            console.error(
                `[${MODULE_NAME}] Validation error:`,
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Request validation failed.",
                code:
                    "VALIDATION_ERROR",
                timestamp:
                    new Date().toISOString(),
            });
        }
    };
};

/* ============================================================================
 * Export
 * ========================================================================== */

module.exports = validate;

/*
 * Named exports for compatibility with other middleware/routes.
 */

module.exports.validate =
    validate;

module.exports.sanitizeQuery =
    sanitizeQuery;

module.exports.sanitizeBody =
    sanitizeBody;

module.exports.validateTeamId =
    validateTeamId;

module.exports.validateMemberId =
    validateMemberId;

module.exports.validateEmailId =
    validateEmailId;

module.exports.validateUserId =
    validateUserId;

module.exports.validateId =
    validateId;

module.exports.isValidObjectId =
    isValidObjectId;

module.exports.isValidEmail =
    isValidEmail;

module.exports.isValidString =
    isValidString;

module.exports.isValidUUID =
    isValidUUID;

/* ============================================================================
 * End validate.js
 * ========================================================================== */

/**
 * ============================================================================
 * validateRequest.js
 * Microsoft 365 Enterprise AI Outlook Email Intelligence Platform
 * ============================================================================
 *
 * Phase 14.4
 * Enterprise Input Validation & Sanitization
 *
 * Responsibilities:
 * - Validate incoming request data
 * - Sanitize user-controlled values
 * - Return centralized validation errors
 * - Prevent malformed input from reaching controllers
 * ============================================================================
 */

"use strict";

const {
    validationResult,
} = require("express-validator");

/**
 * ============================================================================
 * Validation Result Middleware
 * ============================================================================
 */

const validateRequest = (
    req,
    res,
    next
) => {

    const errors =
        validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({

            success: false,

            message:
                "Request validation failed.",

            code:
                "VALIDATION_ERROR",

            errors:
                errors.array().map(
                    (error) => ({

                        field:
                            error.path ||
                            error.param,

                        message:
                            error.msg,

                        location:
                            error.location,
                    })
                ),

            requestId:
                req.requestId,

            timestamp:
                new Date().toISOString(),
        });
    }

    next();
};

module.exports =
    validateRequest;
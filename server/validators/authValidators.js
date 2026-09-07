/**
 * ============================================================================
 * authValidators.js
 * ============================================================================
 *
 * Phase 14.4
 * Authentication Input Validation
 * ============================================================================
 */

"use strict";

const {
    query,
} = require("express-validator");

/**
 * ============================================================================
 * Microsoft Login Validation
 * ============================================================================
 *
 * Existing auth flow:
 *
 * GET /api/auth/login
 * GET /api/auth/redirect
 *
 * We do NOT create protect.js here.
 * ============================================================================
 */

const loginValidation = [

    query("returnUrl")
        .optional()
        .isString()
        .withMessage(
            "returnUrl must be a string."
        )
        .trim()
        .isLength({
            max: 500,
        })
        .withMessage(
            "returnUrl is too long."
        ),
];

module.exports = {
    loginValidation,
};
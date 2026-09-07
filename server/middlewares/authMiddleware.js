"use strict";

/**
 * authMiddleware.js
 * AI Outlook Management System
 *
 * Authentication middleware for application routes.
 */

/* ============================================================================
   REQUIRE GRAPH TOKEN
============================================================================ */

const requireGraphToken = (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: "Authorization token is missing.",
        code: "AUTH_TOKEN_MISSING",
        timestamp: new Date().toISOString(),
      });
    }

    const token = authorization
      .substring(7)
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: "Authorization token is empty.",
        code: "AUTH_TOKEN_EMPTY",
        timestamp: new Date().toISOString(),
      });
    }

    /*
     * Keep token available for routes.
     */
    req.token = token;

    /*
     * Also expose it as Graph token because
     * Analytics / Team may use Microsoft Graph.
     */
    req.graphToken = token;

    next();
  } catch (error) {
    console.error(
      "[Auth Middleware]",
      error
    );

    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Invalid authorization header.",
      code: "AUTH_TOKEN_INVALID",
      timestamp: new Date().toISOString(),
    });
  }
};

/* ============================================================================
   OPTIONAL AUTH
============================================================================ */

const optionalAuth = (req, res, next) => {
  try {
    const authorization =
      req.headers.authorization;

    if (
      authorization &&
      authorization.startsWith("Bearer ")
    ) {
      const token =
        authorization
          .substring(7)
          .trim();

      if (token) {
        req.token = token;
        req.graphToken = token;
      }
    }

    next();
  } catch (error) {
    console.warn(
      "[Optional Auth]",
      error.message
    );

    next();
  }
};

/* ============================================================================
   EXPORT
============================================================================ */

module.exports = {
  requireGraphToken,
  optionalAuth,

  /*
   * Compatibility aliases.
   * This helps if existing routes use another
   * common middleware name.
   */
  authenticate: requireGraphToken,
  authenticateToken: requireGraphToken,
  requireAuth: requireGraphToken,
};
/******************************************************************************
 * protect.js
 * Authentication Middleware
 * Location: server/middleware/protect.js
 ******************************************************************************/

"use strict";

const jwt = require("jsonwebtoken");

/* ============================================================================
   JWT SECRET
============================================================================ */

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_KEY;

/* ============================================================================
   Protect Middleware
============================================================================ */

const protect = (req, res, next) => {
  try {
    /* ------------------------------------------------------------------------
       Authorization Header
    ------------------------------------------------------------------------ */

    const authHeader =
      req.headers.authorization || "";

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required.",
        timestamp: new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       Bearer Token
    ------------------------------------------------------------------------ */

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format. Expected Bearer token.",
        timestamp: new Date().toISOString(),
      });
    }

    const token =
      authHeader
        .substring(7)
        .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
        timestamp: new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       JWT Secret Validation
    ------------------------------------------------------------------------ */

    if (!JWT_SECRET) {
      console.error(
        "[Protect] JWT_SECRET is missing."
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT_SECRET is not configured.",
        timestamp: new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       Verify Token
    ------------------------------------------------------------------------ */

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    /* ------------------------------------------------------------------------
       Attach User
    ------------------------------------------------------------------------ */

    req.user = decoded;

    return next();

  } catch (error) {

    console.error(
      "[Protect]",
      error.message
    );

    /* ------------------------------------------------------------------------
       Token Expired
    ------------------------------------------------------------------------ */

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token has expired.",
        timestamp:
          new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       Invalid Token
    ------------------------------------------------------------------------ */

    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
        timestamp:
          new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       General Error
    ------------------------------------------------------------------------ */

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Authentication failed.",
      timestamp:
        new Date().toISOString(),
    });
  }
};

/* ============================================================================
   Export
============================================================================ */

module.exports = protect;
module.exports.protect = protect;

/******************************************************************************
 * End protect.js
 ******************************************************************************/
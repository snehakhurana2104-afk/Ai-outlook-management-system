/******************************************************************************
 * protect.js
 * Microsoft Graph Authentication Middleware
 *
 * Location:
 * server/middlewares/protect.js
 *
 * Purpose:
 * - Read Microsoft Entra ID / Graph access token
 * - Never verify Graph token with JWT_SECRET
 * - Preserve token as req.accessToken
 * - Preserve token as req.graphToken
 * - Provide compatibility for existing controllers
 ******************************************************************************/

"use strict";

/* ============================================================================
   PROTECT MIDDLEWARE
============================================================================ */

const protect = (req, res, next) => {
  try {
    /* ------------------------------------------------------------------------
       1. READ AUTHORIZATION HEADER
    ------------------------------------------------------------------------ */

    const authHeader =
      req.headers?.authorization || "";

    /* ------------------------------------------------------------------------
       2. TOKEN REQUIRED
    ------------------------------------------------------------------------ */

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Microsoft authentication token is required.",
        code:
          "AUTH_TOKEN_MISSING",
        timestamp:
          new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       3. BEARER FORMAT
    ------------------------------------------------------------------------ */

    if (
      !authHeader
        .toLowerCase()
        .startsWith("bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format. Expected Bearer token.",
        code:
          "AUTH_TOKEN_INVALID_FORMAT",
        timestamp:
          new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       4. EXTRACT TOKEN
    ------------------------------------------------------------------------ */

    const token =
      authHeader
        .substring(7)
        .trim();

    /* ------------------------------------------------------------------------
       5. EMPTY TOKEN
    ------------------------------------------------------------------------ */

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Microsoft authentication token is empty.",
        code:
          "AUTH_TOKEN_EMPTY",
        timestamp:
          new Date().toISOString(),
      });
    }

    /* ------------------------------------------------------------------------
       6. PRESERVE MICROSOFT TOKEN
    ------------------------------------------------------------------------ */

    /*
     * IMPORTANT:
     *
     * This is a Microsoft Entra ID access token.
     *
     * DO NOT:
     *
     * jwt.verify(token, JWT_SECRET)
     *
     * The token is intended for Microsoft Graph.
     */

    req.graphToken = token;

    /*
     * IMPORTANT:
     *
     * A number of existing controllers/services in this project
     * use req.accessToken.
     *
     * Therefore keep BOTH properties.
     */

    req.accessToken = token;

    /* ------------------------------------------------------------------------
       7. COMPATIBILITY USER OBJECT
    ------------------------------------------------------------------------ */

    req.user = {
      accessToken: token,
      authenticationType:
        "microsoft-graph",
    };

    /* ------------------------------------------------------------------------
       8. DEBUG LOG
    ------------------------------------------------------------------------ */

    console.log(
      "[Protect] Microsoft Graph access token accepted."
    );

    console.log(
      "[Protect] req.accessToken:",
      Boolean(req.accessToken)
    );

    console.log(
      "[Protect] req.graphToken:",
      Boolean(req.graphToken)
    );

    /* ------------------------------------------------------------------------
       9. CONTINUE
    ------------------------------------------------------------------------ */

    return next();

  } catch (error) {
    console.error(
      "[Protect] Authentication middleware error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Authentication middleware failed.",
      code:
        "AUTH_MIDDLEWARE_ERROR",
      timestamp:
        new Date().toISOString(),
    });
  }
};

/* ============================================================================
   EXPORT
============================================================================ */

module.exports = protect;

module.exports.protect =
  protect;

/******************************************************************************
 * End protect.js
 ******************************************************************************/
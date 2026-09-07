/******************************************************************************
 * roleMiddleware.js
 * Role Based Authorization Middleware
 * Location: server/middlewares/roleMiddleware.js
 ******************************************************************************/

"use strict";

/* ============================================================================
   Role Middleware
============================================================================ */

/**
 * Usage:
 *
 * router.get(
 *   "/admin",
 *   authMiddleware,
 *   roleMiddleware("admin"),
 *   controller
 * );
 *
 * Multiple roles:
 *
 * roleMiddleware("admin", "manager")
 */

const roleMiddleware = (...allowedRoles) => {

  return (req, res, next) => {

    try {

      /* ----------------------------------------------------------------------
         Check Authentication
      ---------------------------------------------------------------------- */

      if (!req.user) {

        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
          timestamp:
            new Date().toISOString(),
        });

      }

      /* ----------------------------------------------------------------------
         No Roles Configured
      ---------------------------------------------------------------------- */

      if (
        !Array.isArray(allowedRoles) ||
        allowedRoles.length === 0
      ) {

        return next();

      }

      /* ----------------------------------------------------------------------
         Extract User Role
      ---------------------------------------------------------------------- */

      const userRole =
        req.user.role ||
        req.user.roles?.[0] ||
        req.user.userRole ||
        "";

      /* ----------------------------------------------------------------------
         Normalize Roles
      ---------------------------------------------------------------------- */

      const normalizedUserRole =
        String(userRole)
          .trim()
          .toLowerCase();

      const normalizedAllowedRoles =
        allowedRoles.map((role) =>
          String(role)
            .trim()
            .toLowerCase()
        );

      /* ----------------------------------------------------------------------
         Check Permission
      ---------------------------------------------------------------------- */

      if (
        !normalizedAllowedRoles.includes(
          normalizedUserRole
        )
      ) {

        console.warn(
          `[RoleMiddleware] Access denied. User role: ${normalizedUserRole}`
        );

        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to access this resource.",
          role:
            userRole || null,
          requiredRoles:
            allowedRoles,
          timestamp:
            new Date().toISOString(),
        });

      }

      /* ----------------------------------------------------------------------
         Access Granted
      ---------------------------------------------------------------------- */

      return next();

    } catch (error) {

      console.error(
        "[RoleMiddleware]",
        error.message
      );

      return res.status(500).json({
        success: false,
        message:
          "Role authorization failed.",
        timestamp:
          new Date().toISOString(),
      });

    }

  };

};

/* ============================================================================
   Helper: Admin Only
============================================================================ */

const adminOnly =
  roleMiddleware(
    "admin",
    "administrator"
  );

/* ============================================================================
   Helper: Manager Or Admin
============================================================================ */

const managerOrAdmin =
  roleMiddleware(
    "admin",
    "administrator",
    "manager"
  );

/* ============================================================================
   Exports
============================================================================ */

module.exports = roleMiddleware;

module.exports.roleMiddleware =
  roleMiddleware;

module.exports.adminOnly =
  adminOnly;

module.exports.managerOrAdmin =
  managerOrAdmin;

/******************************************************************************
 * End roleMiddleware.js
 ******************************************************************************/
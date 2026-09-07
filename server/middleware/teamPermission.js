/**
 * ============================================================================
 * teamPermission.js
 * Phase 9.5 — Enterprise Team RBAC
 * Microsoft 365 Enterprise Edition
 * ============================================================================
 *
 * Responsibilities:
 * - Centralized role definitions
 * - Centralized permission definitions
 * - Permission validation
 * - Role validation
 * - Consistent 403 responses
 * - Safe fallback role
 * ============================================================================
 */

"use strict";

/* ==========================================================================
   Role Permissions
   ========================================================================== */

const ROLE_PERMISSIONS = Object.freeze({
    Owner: Object.freeze([
        "team:read",
        "team:create",
        "team:update",
        "team:delete",

        "member:read",
        "member:add",
        "member:update",
        "member:remove",

        "role:read",
        "role:update",

        "permission:read",
        "permission:update",
    ]),

    Admin: Object.freeze([
        "team:read",
        "team:update",

        "member:read",
        "member:add",
        "member:update",
        "member:remove",

        "role:read",
        "role:update",

        "permission:read",
    ]),

    Manager: Object.freeze([
        "team:read",

        "member:read",
        "member:add",
        "member:update",

        "role:read",

        "permission:read",
    ]),

    Member: Object.freeze([
        "team:read",
        "member:read",
    ]),

    Viewer: Object.freeze([
        "team:read",
        "member:read",
    ]),
});

/* ==========================================================================
   Supported Roles
   ========================================================================== */

const TEAM_ROLES = Object.freeze(
    Object.keys(ROLE_PERMISSIONS)
);

/* ==========================================================================
   Normalize Role
   ========================================================================== */

const normalizeRole = (role) => {
    if (
        typeof role !== "string" ||
        !role.trim()
    ) {
        return "Viewer";
    }

    const normalized =
        role.trim().toLowerCase();

    const matchedRole =
        TEAM_ROLES.find(
            (item) =>
                item.toLowerCase() ===
                normalized
        );

    return matchedRole || "Viewer";
};

/* ==========================================================================
   Get Role Permissions
   ========================================================================== */

const getRolePermissions = (role) => {
    const normalizedRole =
        normalizeRole(role);

    return [
        ...(ROLE_PERMISSIONS[
            normalizedRole
        ] || []),
    ];
};

/* ==========================================================================
   Check Permission
   ========================================================================== */

const hasPermission = (
    role,
    permission
) => {
    if (
        typeof permission !== "string" ||
        !permission.trim()
    ) {
        return false;
    }

    return getRolePermissions(
        role
    ).includes(
        permission.trim()
    );
};

/* ==========================================================================
   Get Request User Role
   ========================================================================== */

const getRequestRole = (req) => {
    return normalizeRole(
        req?.user?.role ||
        req?.member?.role
    );
};

/* ==========================================================================
   Permission Denied Response
   ========================================================================== */

const permissionDenied = (
    res,
    permission,
    role
) => {
    return res.status(403).json({
        success: false,

        message:
            "You do not have permission to perform this action.",

        code:
            "TEAM_PERMISSION_DENIED",

        data: {
            requiredPermission:
                permission,

            currentRole:
                role,
        },

        timestamp:
            new Date().toISOString(),
    });
};

/* ==========================================================================
   Role Denied Response
   ========================================================================== */

const roleDenied = (
    res,
    allowedRoles,
    currentRole
) => {
    return res.status(403).json({
        success: false,

        message:
            "Your role is not authorized for this action.",

        code:
            "TEAM_ROLE_DENIED",

        data: {
            allowedRoles,
            currentRole,
        },

        timestamp:
            new Date().toISOString(),
    });
};

/* ==========================================================================
   Require Permission
   ========================================================================== */

const requirePermission = (
    permission
) => {
    return (req, res, next) => {
        try {
            if (
                typeof permission !==
                    "string" ||
                !permission.trim()
            ) {
                return res.status(500).json({
                    success: false,

                    message:
                        "Invalid team permission configuration.",

                    code:
                        "INVALID_TEAM_PERMISSION",

                    data: null,

                    timestamp:
                        new Date().toISOString(),
                });
            }

            const role =
                getRequestRole(req);

            if (
                !hasPermission(
                    role,
                    permission
                )
            ) {
                return permissionDenied(
                    res,
                    permission,
                    role
                );
            }

            /*
             * Make the normalized role
             * available to downstream
             * controllers.
             */
            req.teamRole = role;

            next();
        } catch (error) {
            console.error(
                "[Team Permission Middleware]",
                error
            );

            return res.status(500).json({
                success: false,

                message:
                    "Unable to validate team permissions.",

                code:
                    "TEAM_PERMISSION_ERROR",

                data: null,

                timestamp:
                    new Date().toISOString(),
            });
        }
    };
};

/* ==========================================================================
   Require Role
   ========================================================================== */

const requireRole = (
    ...allowedRoles
) => {
    const normalizedRoles =
        allowedRoles.map(
            normalizeRole
        );

    return (req, res, next) => {
        try {
            const currentRole =
                getRequestRole(req);

            if (
                !normalizedRoles.includes(
                    currentRole
                )
            ) {
                return roleDenied(
                    res,
                    normalizedRoles,
                    currentRole
                );
            }

            req.teamRole =
                currentRole;

            next();
        } catch (error) {
            console.error(
                "[Team Role Middleware]",
                error
            );

            return res.status(500).json({
                success: false,

                message:
                    "Unable to validate team role.",

                code:
                    "TEAM_ROLE_ERROR",

                data: null,

                timestamp:
                    new Date().toISOString(),
            });
        }
    };
};

/* ==========================================================================
   Export
   ========================================================================== */

module.exports = {
    ROLE_PERMISSIONS,
    TEAM_ROLES,

    normalizeRole,

    getRolePermissions,
    hasPermission,

    getRequestRole,

    requirePermission,
    requireRole,
};

/**
 * ============================================================================
 * End teamPermission.js
 * ============================================================================
 */
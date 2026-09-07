/**
 * ============================================================================
 * teamRoutes.js
 * Enterprise Team Management Routes
 * ============================================================================
 */

"use strict";

const express = require("express");

const router =
  express.Router();

/* ============================================================================
   Controllers
============================================================================ */

const {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,

  getTeamMembers,
  getTeamMemberById,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,

  getTeamStats,
} = require("../controllers/teamController");

/* ============================================================================
   Authentication
============================================================================ */

const authenticate =
  require("../middleware/authMiddleware");

/* ============================================================================
   Permission Middleware
============================================================================ */

const {
  requirePermission,
} = require("../middleware/teamPermission");

/* ============================================================================
   Validation
============================================================================ */

const {
  validateTeamId,
  validateMemberId,

  validateCreateTeam,
  validateUpdateTeam,

  validateAddTeamMember,
  validateUpdateTeamMember,

  sanitizeQuery,
  sanitizeBody,
} = require("../middleware/teamValidation");

/* ============================================================================
   Authentication
============================================================================ */

router.use(authenticate);

/* ============================================================================
   Sanitization
============================================================================ */

router.use(sanitizeQuery);

router.use(sanitizeBody);

/* ============================================================================
   TEAM ROUTES
============================================================================ */

/**
 * GET /api/teams
 */
router.get(
  "/",
  requirePermission("team:read"),
  getTeams
);

/**
 * GET /api/teams/stats?teamId=TEAM_ID
 *
 * Must stay before /:teamId
 */
router.get(
  "/stats",
  requirePermission("team:read"),
  getTeamStats
);

/**
 * POST /api/teams
 */
router.post(
  "/",
  requirePermission("team:create"),
  validateCreateTeam,
  createTeam
);

/**
 * GET /api/teams/:teamId
 */
router.get(
  "/:teamId",
  requirePermission("team:read"),
  validateTeamId,
  getTeamById
);

/**
 * PUT /api/teams/:teamId
 */
router.put(
  "/:teamId",
  requirePermission("team:update"),
  validateTeamId,
  validateUpdateTeam,
  updateTeam
);

/**
 * DELETE /api/teams/:teamId
 */
router.delete(
  "/:teamId",
  requirePermission("team:delete"),
  validateTeamId,
  deleteTeam
);

/* ============================================================================
   TEAM MEMBER ROUTES
============================================================================ */

/**
 * GET /api/teams/:teamId/members
 */
router.get(
  "/:teamId/members",
  requirePermission("member:read"),
  validateTeamId,
  getTeamMembers
);

/**
 * POST /api/teams/:teamId/members
 */
router.post(
  "/:teamId/members",
  requirePermission("member:add"),
  validateTeamId,
  validateAddTeamMember,
  addTeamMember
);

/**
 * GET /api/teams/:teamId/members/:memberId
 */
router.get(
  "/:teamId/members/:memberId",
  requirePermission("member:read"),
  validateTeamId,
  validateMemberId,
  getTeamMemberById
);

/**
 * PUT /api/teams/:teamId/members/:memberId
 */
router.put(
  "/:teamId/members/:memberId",
  requirePermission("member:update"),
  validateTeamId,
  validateMemberId,
  validateUpdateTeamMember,
  updateTeamMember
);

/**
 * DELETE /api/teams/:teamId/members/:memberId
 */
router.delete(
  "/:teamId/members/:memberId",
  requirePermission("member:remove"),
  validateTeamId,
  validateMemberId,
  removeTeamMember
);

/* ============================================================================
   Export
============================================================================ */

module.exports = router;

/**
 * ============================================================================
 * End teamRoutes.js
 * ============================================================================
 */
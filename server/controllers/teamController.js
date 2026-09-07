/**
 * ============================================================================
 * teamController.js
 * Enterprise Team Management Controller
 * ============================================================================
 *
 * Controller → Service → Model
 *
 * This controller uses the same object-based service contract as
 * teamService.js.
 * ============================================================================
 */

"use strict";

const teamService = require("../services/teamService");

/* ============================================================================
   Constants
============================================================================ */

const MODULE_NAME = "Team";
const API_VERSION = "1.0.0";

/* ============================================================================
   Response Helpers
============================================================================ */

const successResponse = (
  res,
  data = null,
  message = "Success",
  status = 200,
  meta = {}
) => {
  return res.status(status).json({
    success: true,

    message,

    data,

    meta: {
      module:
        MODULE_NAME,

      version:
        API_VERSION,

      timestamp:
        new Date().toISOString(),

      ...meta,
    },
  });
};

/* -------------------------------------------------------------------------- */

const errorResponse = (
  res,
  error,
  fallbackMessage =
    "Unable to process team request."
) => {
  const status =
    Number.isInteger(
      error?.status
    ) &&
    error.status >= 400 &&
    error.status <= 599
      ? error.status
      : 500;

  const code =
    error?.code ||
    "TEAM_REQUEST_ERROR";

  const message =
    error?.message ||
    fallbackMessage;

  if (status >= 500) {
    console.error(
      `[${MODULE_NAME}Controller]`,
      {
        code,
        message,
        stack:
          error?.stack,
      }
    );
  }

  return res.status(status).json({
    success: false,

    message,

    code,

    data: null,

    meta: {
      module:
        MODULE_NAME,

      version:
        API_VERSION,

      timestamp:
        new Date().toISOString(),
    },
  });
};

/* ============================================================================
   Authentication Context
============================================================================ */

const getUserId = (
  req
) => {
  return (
    req?.user?._id ||
    req?.user?.id ||
    req?.user?.userId ||
    null
  );
};

/* -------------------------------------------------------------------------- */

const getTenantId = (
  req
) => {
  return (
    req?.user?.tenantId ||
    req?.auth?.tenantId ||
    null
  );
};

/* -------------------------------------------------------------------------- */

const buildContext = (
  req
) => {
  return {
    userId:
      getUserId(req),

    tenantId:
      getTenantId(req),
  };
};

/* ============================================================================
   GET /api/teams
============================================================================ */

const getTeams = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.getTeams({
        ...buildContext(req),

        page:
          req.query?.page,

        limit:
          req.query?.limit,

        search:
          req.query?.search,

        status:
          req.query?.status,

        sortBy:
          req.query?.sortBy,

        sortOrder:
          req.query?.sortOrder,
      });

    return successResponse(
      res,
      result,
      "Teams loaded successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to load teams."
    );
  }
};

/* ============================================================================
   GET /api/teams/:teamId
============================================================================ */

const getTeamById = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.getTeamById({
        ...buildContext(req),

        teamId:
          req.params.teamId,
      });

    return successResponse(
      res,
      result,
      "Team loaded successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to load team."
    );
  }
};

/* ============================================================================
   POST /api/teams
============================================================================ */

const createTeam = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.createTeam({
        ...buildContext(req),

        data:
          req.body || {},
      });

    return successResponse(
      res,
      result,
      "Team created successfully.",
      201
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to create team."
    );
  }
};

/* ============================================================================
   PUT /api/teams/:teamId
============================================================================ */

const updateTeam = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.updateTeam({
        ...buildContext(req),

        teamId:
          req.params.teamId,

        data:
          req.body || {},
      });

    return successResponse(
      res,
      result,
      "Team updated successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to update team."
    );
  }
};

/* ============================================================================
   DELETE /api/teams/:teamId
============================================================================ */

const deleteTeam = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.deleteTeam({
        ...buildContext(req),

        teamId:
          req.params.teamId,
      });

    return successResponse(
      res,
      result,
      "Team deleted successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to delete team."
    );
  }
};

/* ============================================================================
   GET /api/teams/:teamId/members
============================================================================ */

const getTeamMembers = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.getTeamMembers({
        ...buildContext(req),

        teamId:
          req.params.teamId,

        page:
          req.query?.page,

        limit:
          req.query?.limit,

        search:
          req.query?.search,

        role:
          req.query?.role,

        status:
          req.query?.status,

        sortBy:
          req.query?.sortBy,

        sortOrder:
          req.query?.sortOrder,
      });

    return successResponse(
      res,
      result,
      "Team members loaded successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to load team members."
    );
  }
};

/* ============================================================================
   GET /api/teams/:teamId/members/:memberId
============================================================================ */

const getTeamMemberById =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await teamService.getTeamMemberById(
          {
            ...buildContext(req),

            teamId:
              req.params.teamId,

            memberId:
              req.params.memberId,
          }
        );

      return successResponse(
        res,
        result,
        "Team member loaded successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error,
        "Unable to load team member."
      );
    }
  };

/* ============================================================================
   POST /api/teams/:teamId/members
============================================================================ */

const addTeamMember = async (
  req,
  res
) => {
  try {
    const result =
      await teamService.addTeamMember({
        ...buildContext(req),

        teamId:
          req.params.teamId,

        data:
          req.body || {},
      });

    return successResponse(
      res,
      result,
      "Team member added successfully.",
      201
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to add team member."
    );
  }
};

/* ============================================================================
   PUT /api/teams/:teamId/members/:memberId
============================================================================ */

const updateTeamMember =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await teamService.updateTeamMember(
          {
            ...buildContext(req),

            teamId:
              req.params.teamId,

            memberId:
              req.params.memberId,

            data:
              req.body || {},
          }
        );

      return successResponse(
        res,
        result,
        "Team member updated successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error,
        "Unable to update team member."
      );
    }
  };

/* ============================================================================
   DELETE /api/teams/:teamId/members/:memberId
============================================================================ */

const removeTeamMember =
  async (
    req,
    res
  ) => {
    try {
      const result =
        await teamService.removeTeamMember(
          {
            ...buildContext(req),

            teamId:
              req.params.teamId,

            memberId:
              req.params.memberId,
          }
        );

      return successResponse(
        res,
        result,
        "Team member removed successfully."
      );
    } catch (error) {
      return errorResponse(
        res,
        error,
        "Unable to remove team member."
      );
    }
  };

/* ============================================================================
   GET /api/teams/stats?teamId=...
============================================================================ */

const getTeamStats = async (
  req,
  res
) => {
  try {
    const teamId =
      req.query?.teamId;

    if (!teamId) {
      return errorResponse(
        res,
        {
          status: 400,
          code:
            "TEAM_ID_REQUIRED",
          message:
            "teamId query parameter is required.",
        },
        "Team ID is required."
      );
    }

    const result =
      await teamService.getTeamStats({
        ...buildContext(req),

        teamId,
      });

    return successResponse(
      res,
      result,
      "Team statistics loaded successfully."
    );
  } catch (error) {
    return errorResponse(
      res,
      error,
      "Unable to load team statistics."
    );
  }
};

/* ============================================================================
   Backward Compatibility
============================================================================ */

const getTeamMember =
  getTeamMemberById;

const getTeamStatistics =
  getTeamStats;

/* ============================================================================
   Exports
============================================================================ */

module.exports = {
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

  getTeamMember,

  getTeamStatistics,
};

/**
 * ============================================================================
 * End teamController.js
 * ============================================================================
 */
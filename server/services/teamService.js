/**
 * ============================================================================
 * teamService.js
 * Enterprise Team Management Service
 * ============================================================================
 *
 * Architecture:
 *
 * Route
 *   ↓
 * Controller
 *   ↓
 * Service
 *   ↓
 * MongoDB Models
 *
 * Compatible with:
 * - teamController.js
 * - teamRoutes.js
 * - authMiddleware.js
 * - teamPermission.js
 * - teamValidation.js
 *
 * Models:
 * - ../models/Team
 * - ../models/TeamMember
 * ============================================================================
 */

"use strict";

const mongoose = require("mongoose");

const Team = require("../models/Team");
const TeamMember = require("../models/TeamMember");

/* ============================================================================
   Constants
============================================================================ */

const MODULE_NAME = "TeamService";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const DEFAULT_ROLE = "Member";

const VALID_ROLES = Object.freeze([
  "Owner",
  "Admin",
  "Manager",
  "Member",
  "Viewer",
]);

const VALID_STATUSES = Object.freeze([
  "Active",
  "Inactive",
  "Archived",
]);

/* ============================================================================
   Custom Service Error
============================================================================ */

class TeamServiceError extends Error {
  constructor(
    message,
    code = "TEAM_SERVICE_ERROR",
    status = 500,
    details = null
  ) {
    super(message);

    this.name = "TeamServiceError";
    this.code = code;
    this.status = status;
    this.details = details;

    Error.captureStackTrace?.(
      this,
      TeamServiceError
    );
  }
}

/* ============================================================================
   Helpers
============================================================================ */

const cleanString = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  return String(value).trim();
};

/* -------------------------------------------------------------------------- */

const normalizeEmail = (email) => {
  return cleanString(email).toLowerCase();
};

/* -------------------------------------------------------------------------- */

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

/* -------------------------------------------------------------------------- */

const positiveInteger = (
  value,
  fallback
) => {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return fallback;
  }

  return number;
};

/* -------------------------------------------------------------------------- */

const normalizePagination = (
  page,
  limit
) => {
  const normalizedPage =
    positiveInteger(
      page,
      DEFAULT_PAGE
    );

  const normalizedLimit =
    Math.min(
      positiveInteger(
        limit,
        DEFAULT_LIMIT
      ),
      MAX_LIMIT
    );

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip:
      (normalizedPage - 1) *
      normalizedLimit,
  };
};

/* -------------------------------------------------------------------------- */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

/* -------------------------------------------------------------------------- */

const requireObjectId = (
  id,
  fieldName = "ID"
) => {
  if (!isValidObjectId(id)) {
    throw new TeamServiceError(
      `Invalid ${fieldName}.`,
      "INVALID_OBJECT_ID",
      400
    );
  }

  return new mongoose.Types.ObjectId(id);
};

/* -------------------------------------------------------------------------- */

const normalizeRole = (
  role,
  fallback = DEFAULT_ROLE
) => {
  const normalized = cleanString(
    role,
    fallback
  );

  const matchedRole =
    VALID_ROLES.find(
      (item) =>
        item.toLowerCase() ===
        normalized.toLowerCase()
    );

  if (!matchedRole) {
    throw new TeamServiceError(
      `Invalid team member role: ${normalized}.`,
      "INVALID_TEAM_ROLE",
      400
    );
  }

  return matchedRole;
};

/* -------------------------------------------------------------------------- */

const normalizeStatus = (
  status,
  fallback = "Active"
) => {
  const normalized = cleanString(
    status,
    fallback
  );

  const matchedStatus =
    VALID_STATUSES.find(
      (item) =>
        item.toLowerCase() ===
        normalized.toLowerCase()
    );

  if (!matchedStatus) {
    throw new TeamServiceError(
      `Invalid status: ${normalized}.`,
      "INVALID_TEAM_STATUS",
      400
    );
  }

  return matchedStatus;
};

/* -------------------------------------------------------------------------- */

const getUserId = (user) => {
  if (!user) {
    return null;
  }

  return (
    user._id ||
    user.id ||
    user.userId ||
    null
  );
};

/* -------------------------------------------------------------------------- */

const requireUserId = (user) => {
  const userId =
    getUserId(user);

  if (!userId) {
    throw new TeamServiceError(
      "Authenticated user is required.",
      "AUTHENTICATION_REQUIRED",
      401
    );
  }

  return userId;
};

/* -------------------------------------------------------------------------- */

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* -------------------------------------------------------------------------- */

const logError = (
  operation,
  error
) => {
  console.error(
    `[${MODULE_NAME}] ${operation}`,
    {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack,
    }
  );
};

/* ============================================================================
   Database Error Normalizer
============================================================================ */

const normalizeDatabaseError = (
  error
) => {
  if (
    error instanceof
    TeamServiceError
  ) {
    return error;
  }

  if (error?.code === 11000) {
    return new TeamServiceError(
      "A team or team member with the same unique information already exists.",
      "DUPLICATE_TEAM_RECORD",
      409,
      error?.keyValue || null
    );
  }

  if (
    error?.name ===
    "ValidationError"
  ) {
    return new TeamServiceError(
      "Team data validation failed.",
      "TEAM_VALIDATION_ERROR",
      400,
      Object.keys(
        error.errors || {}
      )
    );
  }

  if (
    error?.name ===
    "CastError"
  ) {
    return new TeamServiceError(
      "Invalid database identifier.",
      "INVALID_DATABASE_ID",
      400
    );
  }

  return error;
};

/* ============================================================================
   Team Access
============================================================================ */

const findAccessibleTeam = async ({
  teamId,
  userId,
  populateMembers = false,
}) => {
  const teamObjectId =
    requireObjectId(
      teamId,
      "team ID"
    );

  const authenticatedUserId =
    requireUserId({
      _id: userId,
    });

  let query = Team.findOne({
    _id: teamObjectId,
    $or: [
      {
        owner:
          authenticatedUserId,
      },
      {
        members:
          authenticatedUserId,
      },
    ],
  });

  if (populateMembers) {
    query = query.populate(
      "members"
    );
  }

  return query.lean();
};

/* ============================================================================
   CREATE TEAM
============================================================================ */

const createTeam = async ({
  userId,
  tenantId = null,
  data = {},
}) => {
  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const name = cleanString(
      data.name
    );

    const description =
      cleanString(
        data.description
      );

    if (!name) {
      throw new TeamServiceError(
        "Team name is required.",
        "TEAM_NAME_REQUIRED",
        400
      );
    }

    if (name.length > 120) {
      throw new TeamServiceError(
        "Team name cannot exceed 120 characters.",
        "TEAM_NAME_TOO_LONG",
        400
      );
    }

    const duplicateFilter = {
      name,
      owner:
        authenticatedUserId,
    };

    if (tenantId) {
      duplicateFilter.tenantId =
        tenantId;
    }

    const existingTeam =
      await Team.findOne(
        duplicateFilter
      ).lean();

    if (existingTeam) {
      throw new TeamServiceError(
        "You already have a team with this name.",
        "TEAM_ALREADY_EXISTS",
        409
      );
    }

    const teamData = {
      ...data,
      name,
      description,
      owner:
        authenticatedUserId,
      createdBy:
        authenticatedUserId,
      updatedBy:
        authenticatedUserId,
    };

    if (tenantId) {
      teamData.tenantId =
        tenantId;
    }

    if (teamData.status) {
      teamData.status =
        normalizeStatus(
          teamData.status
        );
    }

    const team =
      await Team.create(
        teamData
      );

    return team.toObject
      ? team.toObject()
      : team;
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "createTeam",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   GET TEAMS
============================================================================ */

const getTeams = async ({
  userId,
  tenantId = null,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  search = "",
  status,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const pagination =
      normalizePagination(
        page,
        limit
      );

    const filter = {
      $or: [
        {
          owner:
            authenticatedUserId,
        },
        {
          members:
            authenticatedUserId,
        },
      ],
    };

    if (tenantId) {
      filter.tenantId =
        tenantId;
    }

    const normalizedSearch =
      cleanString(search);

    if (normalizedSearch) {
      filter.name = {
        $regex:
          escapeRegex(
            normalizedSearch
          ),
        $options: "i",
      };
    }

    if (status) {
      filter.status =
        normalizeStatus(status);
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "status",
    ];

    const safeSortBy =
      allowedSortFields.includes(
        sortBy
      )
        ? sortBy
        : "createdAt";

    const safeSortOrder =
      String(sortOrder)
        .toLowerCase() ===
      "asc"
        ? 1
        : -1;

    const sort = {
      [safeSortBy]:
        safeSortOrder,
    };

    const [
      teams,
      total,
    ] = await Promise.all([
      Team.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),

      Team.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.ceil(
        total /
          pagination.limit
      );

    return {
      teams,

      pagination: {
        page:
          pagination.page,

        limit:
          pagination.limit,

        total,

        totalPages,

        hasNextPage:
          pagination.page <
          totalPages,

        hasPreviousPage:
          pagination.page > 1,
      },
    };
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "getTeams",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   GET TEAM BY ID
============================================================================ */

const getTeamById = async ({
  teamId,
  userId,
  tenantId = null,
}) => {
  try {
    const team =
      await findAccessibleTeam({
        teamId,
        userId,
        populateMembers: true,
      });

    if (!team) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    if (
      tenantId &&
      team.tenantId &&
      String(team.tenantId) !==
        String(tenantId)
    ) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    return team;
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "getTeamById",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   UPDATE TEAM
============================================================================ */

const updateTeam = async ({
  teamId,
  userId,
  tenantId = null,
  data = {},
}) => {
  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const teamObjectId =
      requireObjectId(
        teamId,
        "team ID"
      );

    const team =
      await Team.findOne({
        _id: teamObjectId,
        owner:
          authenticatedUserId,
      });

    if (!team) {
      throw new TeamServiceError(
        "Team not found or you are not the team owner.",
        "TEAM_UPDATE_DENIED",
        403
      );
    }

    if (
      tenantId &&
      team.tenantId &&
      String(team.tenantId) !==
        String(tenantId)
    ) {
      throw new TeamServiceError(
        "Team access denied.",
        "TEAM_UPDATE_DENIED",
        403
      );
    }

    const allowedFields = [
      "name",
      "description",
      "status",
      "avatar",
      "settings",
    ];

    const updateData = {};

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
      ) {
        updateData[field] =
          data[field];
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "name"
      )
    ) {
      const name =
        cleanString(
          updateData.name
        );

      if (!name) {
        throw new TeamServiceError(
          "Team name cannot be empty.",
          "TEAM_NAME_REQUIRED",
          400
        );
      }

      if (name.length > 120) {
        throw new TeamServiceError(
          "Team name cannot exceed 120 characters.",
          "TEAM_NAME_TOO_LONG",
          400
        );
      }

      updateData.name =
        name;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "status"
      )
    ) {
      updateData.status =
        normalizeStatus(
          updateData.status
        );
    }

    updateData.updatedBy =
      authenticatedUserId;

    const updatedTeam =
      await Team.findByIdAndUpdate(
        teamObjectId,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!updatedTeam) {
      throw new TeamServiceError(
        "Unable to update team.",
        "TEAM_UPDATE_FAILED",
        500
      );
    }

    return updatedTeam;
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "updateTeam",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   DELETE TEAM
============================================================================ */

const deleteTeam = async ({
  teamId,
  userId,
  tenantId = null,
}) => {
  const session =
    await mongoose.startSession();

  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const teamObjectId =
      requireObjectId(
        teamId,
        "team ID"
      );

    let deletedTeam = null;

    await session.withTransaction(
      async () => {
        const team =
          await Team.findOne({
            _id: teamObjectId,
            owner:
              authenticatedUserId,
          }).session(
            session
          );

        if (!team) {
          throw new TeamServiceError(
            "Team not found or you are not the team owner.",
            "TEAM_DELETE_DENIED",
            403
          );
        }

        if (
          tenantId &&
          team.tenantId &&
          String(team.tenantId) !==
            String(tenantId)
        ) {
          throw new TeamServiceError(
            "Team access denied.",
            "TEAM_DELETE_DENIED",
            403
          );
        }

        deletedTeam =
          await Team.findByIdAndDelete(
            teamObjectId,
            {
              session,
            }
          );

        await TeamMember.deleteMany(
          {
            team:
              teamObjectId,
          },
          {
            session,
          }
        );
      }
    );

    return {
      deleted:
        Boolean(
          deletedTeam
        ),

      teamId:
        teamObjectId,
    };
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "deleteTeam",
      normalizedError
    );

    throw normalizedError;
  } finally {
    await session.endSession();
  }
};

/* ============================================================================
   GET TEAM MEMBERS
============================================================================ */

const getTeamMembers = async ({
  teamId,
  userId,
  tenantId = null,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
  search = "",
  role,
  status,
  sortBy = "createdAt",
  sortOrder = "asc",
}) => {
  try {
    const team =
      await findAccessibleTeam({
        teamId,
        userId,
      });

    if (!team) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    if (
      tenantId &&
      team.tenantId &&
      String(team.tenantId) !==
        String(tenantId)
    ) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    const pagination =
      normalizePagination(
        page,
        limit
      );

    const filter = {
      team:
        team._id,
    };

    if (role) {
      filter.role =
        normalizeRole(role);
    }

    if (status) {
      filter.status =
        normalizeStatus(status);
    }

    const normalizedSearch =
      cleanString(search);

    if (normalizedSearch) {
      const escapedSearch =
        escapeRegex(
          normalizedSearch
        );

      filter.$or = [
        {
          name: {
            $regex:
              escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex:
              escapedSearch,
            $options: "i",
          },
        },
        {
          department: {
            $regex:
              escapedSearch,
            $options: "i",
          },
        },
        {
          title: {
            $regex:
              escapedSearch,
            $options: "i",
          },
        },
      ];
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "email",
      "role",
      "status",
    ];

    const safeSortBy =
      allowedSortFields.includes(
        sortBy
      )
        ? sortBy
        : "createdAt";

    const safeSortOrder =
      String(sortOrder)
        .toLowerCase() ===
      "desc"
        ? -1
        : 1;

    const sort = {
      [safeSortBy]:
        safeSortOrder,
    };

    const [
      members,
      total,
    ] = await Promise.all([
      TeamMember.find(filter)
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),

      TeamMember.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.ceil(
        total /
          pagination.limit
      );

    return {
      members,

      pagination: {
        page:
          pagination.page,

        limit:
          pagination.limit,

        total,

        totalPages,

        hasNextPage:
          pagination.page <
          totalPages,

        hasPreviousPage:
          pagination.page > 1,
      },
    };
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "getTeamMembers",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   GET TEAM MEMBER BY ID
============================================================================ */

const getTeamMemberById = async ({
  teamId,
  memberId,
  userId,
  tenantId = null,
}) => {
  try {
    const team =
      await findAccessibleTeam({
        teamId,
        userId,
      });

    if (!team) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    if (
      tenantId &&
      team.tenantId &&
      String(team.tenantId) !==
        String(tenantId)
    ) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    const memberObjectId =
      requireObjectId(
        memberId,
        "member ID"
      );

    const member =
      await TeamMember.findOne({
        _id: memberObjectId,
        team: team._id,
      }).lean();

    if (!member) {
      throw new TeamServiceError(
        "Team member not found.",
        "TEAM_MEMBER_NOT_FOUND",
        404
      );
    }

    return member;
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "getTeamMemberById",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   ADD TEAM MEMBER
============================================================================ */

const addTeamMember = async ({
  teamId,
  userId,
  tenantId = null,
  data = {},
}) => {
  const session =
    await mongoose.startSession();

  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const teamObjectId =
      requireObjectId(
        teamId,
        "team ID"
      );

    const email =
      normalizeEmail(
        data.email
      );

    const name =
      cleanString(
        data.name
      );

    const role =
      normalizeRole(
        data.role,
        DEFAULT_ROLE
      );

    if (!email) {
      throw new TeamServiceError(
        "Member email is required.",
        "MEMBER_EMAIL_REQUIRED",
        400
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      throw new TeamServiceError(
        "Invalid member email address.",
        "INVALID_MEMBER_EMAIL",
        400
      );
    }

    if (!name) {
      throw new TeamServiceError(
        "Member name is required.",
        "MEMBER_NAME_REQUIRED",
        400
      );
    }

    let createdMember = null;

    await session.withTransaction(
      async () => {
        const team =
          await Team.findOne({
            _id:
              teamObjectId,
            owner:
              authenticatedUserId,
          }).session(
            session
          );

        if (!team) {
          throw new TeamServiceError(
            "Only the team owner can add team members.",
            "MEMBER_ADD_DENIED",
            403
          );
        }

        if (
          tenantId &&
          team.tenantId &&
          String(
            team.tenantId
          ) !==
            String(tenantId)
        ) {
          throw new TeamServiceError(
            "Team access denied.",
            "MEMBER_ADD_DENIED",
            403
          );
        }

        const existingMember =
          await TeamMember.findOne({
            team:
              teamObjectId,
            email,
          }).session(
            session
          );

        if (existingMember) {
          throw new TeamServiceError(
            "This email is already a member of the team.",
            "MEMBER_ALREADY_EXISTS",
            409
          );
        }

        /*
         * Do not allow an Owner role through
         * normal member creation.
         */
        if (role === "Owner") {
          throw new TeamServiceError(
            "Team ownership cannot be assigned through member creation.",
            "OWNER_ROLE_NOT_ALLOWED",
            400
          );
        }

        const memberData = {
          ...data,

          team:
            teamObjectId,

          name,

          email,

          role,

          createdBy:
            authenticatedUserId,

          updatedBy:
            authenticatedUserId,
        };

        if (
          tenantId
        ) {
          memberData.tenantId =
            tenantId;
        }

        createdMember =
          await TeamMember.create(
            [
              memberData,
            ],
            {
              session,
            }
          );

        createdMember =
          createdMember[0];

        await Team.findByIdAndUpdate(
          teamObjectId,
          {
            $addToSet: {
              members:
                createdMember._id,
            },

            $set: {
              updatedBy:
                authenticatedUserId,
            },
          },
          {
            session,
          }
        );
      }
    );

    return createdMember?.toObject
      ? createdMember.toObject()
      : createdMember;
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "addTeamMember",
      normalizedError
    );

    throw normalizedError;
  } finally {
    await session.endSession();
  }
};

/* ============================================================================
   UPDATE TEAM MEMBER
============================================================================ */

const updateTeamMember = async ({
  teamId,
  memberId,
  userId,
  tenantId = null,
  data = {},
}) => {
  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const teamObjectId =
      requireObjectId(
        teamId,
        "team ID"
      );

    const memberObjectId =
      requireObjectId(
        memberId,
        "member ID"
      );

    const team =
      await Team.findOne({
        _id:
          teamObjectId,
        owner:
          authenticatedUserId,
      }).lean();

    if (!team) {
      throw new TeamServiceError(
        "Only the team owner can update this member.",
        "MEMBER_UPDATE_DENIED",
        403
      );
    }

    if (
      tenantId &&
      team.tenantId &&
      String(
        team.tenantId
      ) !==
        String(tenantId)
    ) {
      throw new TeamServiceError(
        "Team access denied.",
        "MEMBER_UPDATE_DENIED",
        403
      );
    }

    const member =
      await TeamMember.findOne({
        _id:
          memberObjectId,
        team:
          teamObjectId,
      });

    if (!member) {
      throw new TeamServiceError(
        "Team member not found.",
        "TEAM_MEMBER_NOT_FOUND",
        404
      );
    }

    const allowedFields = [
      "name",
      "email",
      "role",
      "status",
      "title",
      "department",
      "avatar",
    ];

    const updateData = {};

    for (
      const field of allowedFields
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          data,
          field
        )
      ) {
        updateData[field] =
          data[field];
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "name"
      )
    ) {
      updateData.name =
        cleanString(
          updateData.name
        );

      if (!updateData.name) {
        throw new TeamServiceError(
          "Member name cannot be empty.",
          "MEMBER_NAME_REQUIRED",
          400
        );
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "email"
      )
    ) {
      updateData.email =
        normalizeEmail(
          updateData.email
        );

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          updateData.email
        )
      ) {
        throw new TeamServiceError(
          "Invalid member email address.",
          "INVALID_MEMBER_EMAIL",
          400
        );
      }

      const duplicate =
        await TeamMember.findOne({
          team:
            teamObjectId,
          email:
            updateData.email,
          _id: {
            $ne:
              memberObjectId,
          },
        }).lean();

      if (duplicate) {
        throw new TeamServiceError(
          "Another team member already uses this email.",
          "MEMBER_EMAIL_ALREADY_EXISTS",
          409
        );
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "role"
      )
    ) {
      updateData.role =
        normalizeRole(
          updateData.role
        );

      if (
        updateData.role ===
        "Owner"
      ) {
        throw new TeamServiceError(
          "Team ownership cannot be transferred through member role updates.",
          "OWNER_TRANSFER_NOT_ALLOWED",
          400
        );
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        "status"
      )
    ) {
      updateData.status =
        normalizeStatus(
          updateData.status
        );
    }

    updateData.updatedBy =
      authenticatedUserId;

    const updatedMember =
      await TeamMember.findOneAndUpdate(
        {
          _id:
            memberObjectId,
          team:
            teamObjectId,
        },
        {
          $set:
            updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      ).lean();

    if (!updatedMember) {
      throw new TeamServiceError(
        "Unable to update team member.",
        "MEMBER_UPDATE_FAILED",
        500
      );
    }

    return updatedMember;
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "updateTeamMember",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   REMOVE TEAM MEMBER
============================================================================ */

const removeTeamMember = async ({
  teamId,
  memberId,
  userId,
  tenantId = null,
}) => {
  const session =
    await mongoose.startSession();

  try {
    const authenticatedUserId =
      requireUserId({
        _id: userId,
      });

    const teamObjectId =
      requireObjectId(
        teamId,
        "team ID"
      );

    const memberObjectId =
      requireObjectId(
        memberId,
        "member ID"
      );

    let removed = false;

    await session.withTransaction(
      async () => {
        const team =
          await Team.findOne({
            _id:
              teamObjectId,
            owner:
              authenticatedUserId,
          }).session(
            session
          );

        if (!team) {
          throw new TeamServiceError(
            "Only the team owner can remove team members.",
            "MEMBER_REMOVE_DENIED",
            403
          );
        }

        if (
          tenantId &&
          team.tenantId &&
          String(
            team.tenantId
          ) !==
            String(tenantId)
        ) {
          throw new TeamServiceError(
            "Team access denied.",
            "MEMBER_REMOVE_DENIED",
            403
          );
        }

        const member =
          await TeamMember.findOne({
            _id:
              memberObjectId,
            team:
              teamObjectId,
          }).session(
            session
          );

        if (!member) {
          throw new TeamServiceError(
            "Team member not found.",
            "TEAM_MEMBER_NOT_FOUND",
            404
          );
        }

        if (
          member.role ===
          "Owner"
        ) {
          throw new TeamServiceError(
            "The team owner cannot be removed.",
            "OWNER_REMOVE_DENIED",
            403
          );
        }

        await TeamMember.deleteOne(
          {
            _id:
              memberObjectId,
            team:
              teamObjectId,
          },
          {
            session,
          }
        );

        await Team.findByIdAndUpdate(
          teamObjectId,
          {
            $pull: {
              members:
                memberObjectId,
            },

            $set: {
              updatedBy:
                authenticatedUserId,
            },
          },
          {
            session,
          }
        );

        removed = true;
      }
    );

    return {
      removed,

      memberId:
        memberObjectId,

      teamId:
        teamObjectId,
    };
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "removeTeamMember",
      normalizedError
    );

    throw normalizedError;
  } finally {
    await session.endSession();
  }
};

/* ============================================================================
   TEAM STATISTICS
============================================================================ */

const getTeamStats = async ({
  teamId,
  userId,
  tenantId = null,
}) => {
  try {
    const team =
      await findAccessibleTeam({
        teamId,
        userId,
      });

    if (!team) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    if (
      tenantId &&
      team.tenantId &&
      String(
        team.tenantId
      ) !==
        String(tenantId)
    ) {
      throw new TeamServiceError(
        "Team not found or access denied.",
        "TEAM_NOT_FOUND",
        404
      );
    }

    const [
      totalMembers,
      activeMembers,
      roleDistribution,
      statusDistribution,
    ] = await Promise.all([
      TeamMember.countDocuments({
        team:
          team._id,
      }),

      TeamMember.countDocuments({
        team:
          team._id,
        status:
          "Active",
      }),

      TeamMember.aggregate([
        {
          $match: {
            team:
              team._id,
          },
        },

        {
          $group: {
            _id:
              "$role",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            role:
              "$_id",

            count: 1,
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]),

      TeamMember.aggregate([
        {
          $match: {
            team:
              team._id,
          },
        },

        {
          $group: {
            _id:
              "$status",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            status:
              "$_id",

            count: 1,
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]),
    ]);

    const total =
      safeNumber(
        totalMembers
      );

    const active =
      safeNumber(
        activeMembers
      );

    return {
      teamId:
        team._id,

      teamName:
        team.name || "",

      totalMembers:
        total,

      activeMembers:
        active,

      inactiveMembers:
        Math.max(
          0,
          total - active
        ),

      roleDistribution,

      statusDistribution,

      status:
        team.status ||
        "Active",

      createdAt:
        team.createdAt ||
        null,

      updatedAt:
        team.updatedAt ||
        null,
    };
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "getTeamStats",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   FIND TEAM BY ID
============================================================================ */

const findTeamById = async ({
  teamId,
  userId = null,
  populateMembers = false,
}) => {
  try {
    const teamObjectId =
      requireObjectId(
        teamId,
        "team ID"
      );

    let query =
      Team.findById(
        teamObjectId
      );

    if (populateMembers) {
      query =
        query.populate(
          "members"
        );
    }

    return await query.lean();
  } catch (error) {
    const normalizedError =
      normalizeDatabaseError(
        error
      );

    logError(
      "findTeamById",
      normalizedError
    );

    throw normalizedError;
  }
};

/* ============================================================================
   EXPORTS
============================================================================ */

module.exports = {
  TeamServiceError,

  VALID_ROLES,

  DEFAULT_ROLE,

  createTeam,

  getTeams,

  getTeamById,

  updateTeam,

  deleteTeam,

  getTeamMembers,

  getTeamMemberById,

  addTeamMember,

  updateTeamMember,

  removeTeamMember,

  getTeamStats,

  findTeamById,
};

/**
 * ============================================================================
 * End teamService.js
 * ============================================================================
 */

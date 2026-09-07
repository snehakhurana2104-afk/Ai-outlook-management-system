/******************************************************************************
 * authorize.js
 * Role / Permission Authorization Middleware
 ******************************************************************************/

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // If no roles were specified, allow authenticated request
      if (!allowedRoles || allowedRoles.length === 0) {
        return next();
      }

      const user = req.user;

      // Development mode
      if (!user) {
        if (
          String(process.env.REQUIRE_AUTH).toLowerCase() !== "true"
        ) {
          req.user = {
            id: "development-user",
            role: "admin",
            email:
              process.env.OUTLOOK_USER_EMAIL ||
              "development@localhost",
          };

          return next();
        }

        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const userRole =
        user.role ||
        user.userRole ||
        user.type ||
        "user";

      const normalizedRole =
        String(userRole).toLowerCase();

      const normalizedAllowedRoles =
        allowedRoles.map((role) =>
          String(role).toLowerCase()
        );

      // Admin has access to everything
      if (normalizedRole === "admin") {
        return next();
      }

      if (
        normalizedAllowedRoles.includes(
          normalizedRole
        )
      ) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this resource.",
      });
    } catch (error) {
      console.error(
        "[Authorize Middleware]",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Authorization failed.",
      });
    }
  };
};

module.exports = authorize;
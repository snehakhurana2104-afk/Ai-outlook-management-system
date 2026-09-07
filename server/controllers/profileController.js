/******************************************************************************
 * profileController.js
 * Part 1
 * Enterprise Profile Controller
 ******************************************************************************/

const User = require("../models/User");

/* ==========================================================================
   Microsoft Graph Services
========================================================================== */

const graphUserService =
  require("../services/graphUserService");

const graphMailService =
  require("../services/graphMailService");

/* ==========================================================================
   Response Helpers
========================================================================== */

const successResponse = (
  res,
  data = {},
  message = "Success",
  status = 200
) => {

  return res.status(status).json({

    success: true,

    message,

    data,

    timestamp:
      new Date().toISOString(),

  });

};

const errorResponse = (
  res,
  error,
  status = 500
) => {

  console.error(

    "[ProfileController]",

    error

  );

  return res.status(status).json({

    success: false,

    message:

      error?.message ||

      "Internal Server Error",

    timestamp:

      new Date().toISOString(),

  });

};

/* ==========================================================================
   Utility Helpers
========================================================================== */

const safeNumber = value =>
  Number(value || 0);

const validateUser = async (userId) => {

  const user = await User.findById(userId);

  if (!user) {

    throw new Error(

      "User not found."

    );

  }

  return user;

};

/* ==========================================================================
   Profile Controller Starts
========================================================================== */
/******************************************************************************
 * getProfile()
 ******************************************************************************/

const getProfile = async (req, res) => {

  try {

    const graphProfile =

      await graphUserService.getMyProfile();

    const localUser = await User.findOne({

      email:

        graphProfile.mail ||

        graphProfile.userPrincipalName,

    }).lean();

    const profile = {

      id:

        graphProfile.id,

      displayName:

        graphProfile.displayName,

      firstName:

        graphProfile.givenName,

      lastName:

        graphProfile.surname,

      email:

        graphProfile.mail ||

        graphProfile.userPrincipalName,

      jobTitle:

        graphProfile.jobTitle,

      department:

        graphProfile.department,

      officeLocation:

        graphProfile.officeLocation,

      mobilePhone:

        graphProfile.mobilePhone,

      businessPhones:

        graphProfile.businessPhones || [],

      preferredLanguage:

        graphProfile.preferredLanguage,

      photo:

        localUser?.photo ||

        null,

      role:

        localUser?.role ||

        "User",

      preferences:

        localUser?.preferences ||

        {},

      generatedAt:

        new Date().toISOString(),

    };

    return successResponse(

      res,

      profile,

      "Profile loaded successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};


/******************************************************************************
 * getProfileStatistics()
 ******************************************************************************/

const getProfileStatistics = async (req, res) => {

  try {

    const mailboxStats =

      await graphMailService.getMailboxStatistics();

    const profile =

      await graphUserService.getMyProfile();

    const statistics = {

      user: {

        displayName:

          profile.displayName,

        email:

          profile.mail ||

          profile.userPrincipalName,

      },

      mailbox: {

        totalEmails:

          safeNumber(

            mailboxStats.totalEmails

          ),

        readEmails:

          safeNumber(

            mailboxStats.readEmails

          ),

        unreadEmails:

          safeNumber(

            mailboxStats.unreadEmails

          ),

        highPriority:

          safeNumber(

            mailboxStats.highPriority

          ),

      },

      responseRate:

        mailboxStats.totalEmails

          ? Number(

              (

                mailboxStats.readEmails /

                mailboxStats.totalEmails

              ) * 100

            ).toFixed(2)

          : "0.00",

      generatedAt:

        new Date().toISOString(),

    };

    return successResponse(

      res,

      statistics,

      "Profile statistics loaded successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};
/******************************************************************************
 * updateProfile()
 ******************************************************************************/

const updateProfile = async (req, res) => {

  try {

    const {

      displayName,

      mobilePhone,

      department,

      officeLocation,

      jobTitle,

      preferences,

    } = req.body;

    /* ---------------------------------------------------------
       Update Microsoft Graph Profile
    --------------------------------------------------------- */

    await graphUserService.updateMyProfile({

      displayName,

      mobilePhone,

      department,

      officeLocation,

      jobTitle,

    });

    /* ---------------------------------------------------------
       Update Local User Profile
    --------------------------------------------------------- */

    const graphProfile =

      await graphUserService.getMyProfile();

    const updatedUser =

      await User.findOneAndUpdate(

        {

          email:

            graphProfile.mail ||

            graphProfile.userPrincipalName,

        },

        {

          $set: {

            preferences:

              preferences || {},

            updatedAt:

              new Date(),

          },

        },

        {

          new: true,

        }

      ).lean();

    return successResponse(

      res,

      {

        profile:

          updatedUser,

        generatedAt:

          new Date().toISOString(),

      },

      "Profile updated successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};


/******************************************************************************
 * updateProfilePhoto()
 ******************************************************************************/

const updateProfilePhoto = async (req, res) => {

  try {

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message:

          "Profile photo is required.",

      });

    }

    await graphUserService.updateProfilePhoto(

      req.file.buffer

    );

    const graphProfile =

      await graphUserService.getMyProfile();

    await User.findOneAndUpdate(

      {

        email:

          graphProfile.mail ||

          graphProfile.userPrincipalName,

      },

      {

        $set: {

          photo:

            `/uploads/profile/${req.file.filename}`,

          updatedAt:

            new Date(),

        },

      }

    );

    return successResponse(

      res,

      {

        photo:

          `/uploads/profile/${req.file.filename}`,

        generatedAt:

          new Date().toISOString(),

      },

      "Profile photo updated successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};
/******************************************************************************
 * changePassword()
 ******************************************************************************/

const changePassword = async (req, res) => {

  try {

    const {

      currentPassword,

      newPassword,

      confirmPassword,

    } = req.body;

    if (!newPassword || !confirmPassword) {

      return res.status(400).json({

        success: false,

        message:

          "New password and confirmation are required.",

      });

    }

    if (newPassword !== confirmPassword) {

      return res.status(400).json({

        success: false,

        message:

          "Passwords do not match.",

      });

    }

    await graphUserService.changePassword({

      currentPassword,

      newPassword,

    });

    return successResponse(

      res,

      {

        changedAt:

          new Date().toISOString(),

      },

      "Password changed successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};


/******************************************************************************
 * deleteProfile()
 ******************************************************************************/

const deleteProfile = async (req, res) => {

  try {

    const graphProfile =

      await graphUserService.getMyProfile();

    const deletedUser =

      await User.findOneAndDelete({

        email:

          graphProfile.mail ||

          graphProfile.userPrincipalName,

      });

    if (!deletedUser) {

      return res.status(404).json({

        success: false,

        message:

          "Profile not found.",

      });

    }

    return successResponse(

      res,

      {

        deleted: true,

        deletedAt:

          new Date().toISOString(),

      },

      "Profile deleted successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};
/******************************************************************************
 * getProfilePreferences()
 ******************************************************************************/

const getProfilePreferences = async (req, res) => {

  try {

    const graphProfile =
      await graphUserService.getMyProfile();

    const user =
      await User.findOne({

        email:
          graphProfile.mail ||
          graphProfile.userPrincipalName,

      }).lean();

    return successResponse(

      res,

      {

        preferences:

          user?.preferences || {},

        generatedAt:

          new Date().toISOString(),

      },

      "Profile preferences loaded successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};


/******************************************************************************
 * updateProfilePreferences()
 ******************************************************************************/

const updateProfilePreferences = async (req, res) => {

  try {

    const graphProfile =
      await graphUserService.getMyProfile();

    const preferences =
      req.body || {};

    const updatedUser =
      await User.findOneAndUpdate(

        {

          email:
            graphProfile.mail ||
            graphProfile.userPrincipalName,

        },

        {

          $set: {

            preferences,

            updatedAt:
              new Date(),

          },

        },

        {

          new: true,

          lean: true,

        }

      );

    return successResponse(

      res,

      {

        preferences:

          updatedUser.preferences,

        generatedAt:

          new Date().toISOString(),

      },

      "Profile preferences updated successfully."

    );

  }

  catch (error) {

    return errorResponse(

      res,

      error

    );

  }

};


/******************************************************************************
 * Export Controller
 ******************************************************************************/

module.exports = {

  getProfile,

  getProfileStatistics,

  updateProfile,

  updateProfilePhoto,

  changePassword,

  deleteProfile,

  getProfilePreferences,

  updateProfilePreferences,

};

/******************************************************************************
 * End profileController.js
 ******************************************************************************/
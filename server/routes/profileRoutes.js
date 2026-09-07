/******************************************************************************
 * profileRoutes.js
 ******************************************************************************/

const express = require("express");

const router = express.Router();

const {

  getProfile,
  getProfileStatistics,
  updateProfile,
  updateProfilePhoto,
  changePassword,
  deleteProfile,
  getProfilePreferences,
  updateProfilePreferences,

} = require("../controllers/profileController");

const authenticate =
  require("../middleware/authMiddleware");

const authorize =
  require("../middleware/authorize");

const upload =
  require("../middleware/uploadMiddleware");

/******************************************************************************
 * Global Authentication
 ******************************************************************************/

router.use(authenticate);

/******************************************************************************
 * Profile
 ******************************************************************************/

router.get(
  "/",
  authorize("profile.read"),
  getProfile
);

router.get(
  "/statistics",
  authorize("profile.read"),
  getProfileStatistics
);

router.put(
  "/",
  authorize("profile.update"),
  updateProfile
);

router.put(
  "/photo",
  authorize("profile.update"),
  upload.single("photo"),
  updateProfilePhoto
);

router.put(
  "/password",
  authorize("profile.update"),
  changePassword
);

router.delete(
  "/",
  authorize("profile.delete"),
  deleteProfile
);

/******************************************************************************
 * Preferences
 ******************************************************************************/

router.get(
  "/preferences",
  authorize("profile.read"),
  getProfilePreferences
);

router.put(
  "/preferences",
  authorize("profile.update"),
  updateProfilePreferences
);

/******************************************************************************
 * Health
 ******************************************************************************/

router.get("/health", (req, res) => {

  return res.status(200).json({

    success: true,

    service: "Profile API",

    status: "Healthy",

    timestamp: new Date().toISOString(),

  });

});

/******************************************************************************
 * Export
 ******************************************************************************/

module.exports = router;
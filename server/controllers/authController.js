const jwt = require("jsonwebtoken");
const cca = require("../config/graph");
const User = require("../models/User");

// ======================================
// MICROSOFT LOGIN
// GET /api/auth/login
// ======================================

const login = async (req, res) => {
  try {
    const authCodeUrlParameters = {
      scopes: process.env.SCOPES.split(" "),
      redirectUri: process.env.REDIRECT_URI,
    };

    const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);

    return res.redirect(authUrl);
  } catch (error) {
    console.error("Microsoft Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate Microsoft Login URL",
      error: error.message,
    });
  }
};

// ======================================
// MICROSOFT REDIRECT
// GET /api/auth/redirect
// ======================================

const redirect = async (req, res) => {
  try {
    if (!req.query.code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code not received.",
      });
    }

    const tokenRequest = {
      code: req.query.code,
      scopes: process.env.SCOPES.split(" "),
      redirectUri: process.env.REDIRECT_URI,
    };

    const response = await cca.acquireTokenByCode(tokenRequest);

    const account = response.account;

    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Microsoft account not found.",
      });
    }

    const microsoftId = account.homeAccountId;
    const displayName = account.name;
    const email =
      account.username || process.env.OUTLOOK_USER_EMAIL;

    // ======================================
    // FIND OR CREATE USER
    // ======================================

    let user = await User.findOne({
      microsoftId,
    });

    if (!user) {
      user = await User.create({
        microsoftId,
        displayName,
        email,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || "",
        lastSync: new Date(),
        role: "Employee",
      });
    } else {
      user.displayName = displayName;
      user.email = email;
      user.accessToken = response.accessToken;
      user.refreshToken =
        response.refreshToken || user.refreshToken;
      user.lastSync = new Date();

      await user.save();
    }

    // ======================================
    // JWT SECRET CHECK
    // ======================================

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    // ======================================
    // GENERATE JWT
    // ======================================

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ======================================
    // RESPONSE
    // ======================================

const frontendURL =
  process.env.FRONTEND_URL || "http://localhost:3000";

const encodedUser = encodeURIComponent(
  JSON.stringify({
    id: user._id,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    lastSync: user.lastSync,
  })
);

return res.redirect(
  `${frontendURL}/auth/callback?token=${token}&user=${encodedUser}`
);
      
  } catch (error) {
    console.error("Authentication Error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication Failed",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  redirect,
};
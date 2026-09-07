const express = require("express");

const router = express.Router();

const {
    login,
    redirect,
} = require("../controllers/authController");

router.get(
    "/login",
    login
);

router.get(
    "/redirect",
    redirect
);

module.exports = router;
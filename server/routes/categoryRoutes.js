const express = require("express");
const router = express.Router();

const {
  getCategories,
} = require("../controllers/categoryController");

// ======================================
// GET Categories
// ======================================

router.get("/", getCategories);

module.exports = router;
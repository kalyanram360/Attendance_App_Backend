const express = require("express");
const router = express.Router();
const {
  validateCollege,
  registerCollege,
  getAllColleges,
} = require("../controlers/validationController");

// Main validation endpoint for Android app
router.post("/validate", validateCollege);

// Admin/Testing endpoints
router.post("/register", registerCollege);
router.get("/colleges", getAllColleges);

module.exports = router;

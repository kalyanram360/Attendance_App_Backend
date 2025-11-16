const express = require("express");
const router = express.Router();
const {
  validateCollege,
  registerCollege,
  getAllColleges,
  checkCollege,
} = require("../controlers/validationController");

// Main validation endpoint for Android app
router.post("/validate", validateCollege);

// Admin/Testing endpoints
router.post("/register", registerCollege);
router.get("/colleges", getAllColleges);
router.get("/check/:collegeEmail/:collegeName/:activationCode", checkCollege);

module.exports = router;

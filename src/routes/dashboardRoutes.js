const express = require("express");
const router = express.Router();
const { getStudentDashboard } = require("../controlers/Dashboard.controlers");

// Student dashboard route
router.get("/student/dashboard", getStudentDashboard);

module.exports = router;

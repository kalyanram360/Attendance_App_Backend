const express = require("express");
const router = express.Router();
const {
  validateCollege,
  registerCollege,
  getAllColleges,
  checkCollege,
} = require("../controlers/validationController");
const {
  registerTeacher,
  getAllTeachers,
} = require("../controlers/Teacher.Controlers");

const {
  registerStudent,
  getAllStudents,
} = require("../controlers/Student.controlers");

// Main validation endpoint for Android app
router.post("/validate", validateCollege);

// Admin/Testing endpoints
router.post("/register", registerCollege);
router.get("/colleges", getAllColleges);
router.get("/check/:collegeEmail/:collegeName/:activationCode", checkCollege);

// Student routes
router.post("/student/register", registerStudent);
router.get("/students", getAllStudents);

// Teacher routes
router.post("/teacher/register", registerTeacher);
router.get("/teachers", getAllTeachers);

module.exports = router;

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
  checkTeacher,
} = require("../controlers/Teacher.Controlers");

const {
  registerStudent,
  getAllStudents,
  checkStudent,
} = require("../controlers/Student.controlers");

const {
  createClass,
  getCurrentClass,
} = require("../controlers/CreateClass.Controlers");

// Main validation endpoint for Android app
router.post("/validate", validateCollege);

// Admin/Testing endpoints
router.post("/register", registerCollege);
router.get("/colleges", getAllColleges);
router.get("/check/:collegeEmail/:collegeName/:activationCode", checkCollege);

// Student routes
router.post("/student/register", registerStudent);
router.get("/students", getAllStudents);
router.get("/student/check/:collegeEmail", checkStudent);

// Teacher routes
router.post("/teacher/register", registerTeacher);
router.get("/teachers", getAllTeachers);
router.get("/teacher/check/:collegeEmail", checkTeacher);

//class routes
router.post("/class/create", createClass);
router.get("/class/current", getCurrentClass);
router.patch("/class/:token/mark/:rollNo", markStudentPresent);

module.exports = router;

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
  checkStudentWithActivation,
} = require("../controlers/Student.controlers");

const {
  createClass,
  getCurrentClass,
  markStudentPresent,
  getClassBranches,
  getAttendanceSummary,
  archiveClass,
  deleteClassByToken,
} = require("../controlers/CreateClass.Controlers");

const {
  postAttendance,
  getAttendance,
} = require("../controlers/Attendance.controlers");

// Attendance routes
router.post("/attendance", postAttendance);
router.get("/attendance", getAttendance);

// Main validation endpoint for Android app
router.post("/validate", validateCollege);

// Admin/Testing endpoints
router.post("/register", registerCollege);
router.get("/colleges", getAllColleges);
router.get("/check/:collegeEmail/:collegeName/:activationCode", checkCollege);

// Student routes
router.post("/student/register", registerStudent);
router.get("/students", getAllStudents);
router.get("/student/check/:collegeEmail/:activationCode", checkStudent);
router.get(
  "/student/check-with-activation/:collegeEmail/:activationCode",
  checkStudentWithActivation
);

// Teacher routes
router.post("/teacher/register", registerTeacher);
router.get("/teachers", getAllTeachers);
router.get("/teacher/check/:collegeEmail/:activationCode", checkTeacher);

//class routes
router.post("/class/create", createClass);
router.get("/class/current", getCurrentClass);
router.patch("/class/mark/:token/:rollNo", markStudentPresent);
router.get("/class/branches/:classId", getClassBranches);
router.get("/class/attendance-summary/:classId", getAttendanceSummary);
router.post("/class/archive", archiveClass);
router.delete("/class/delete/:token", deleteClassByToken);

module.exports = router;

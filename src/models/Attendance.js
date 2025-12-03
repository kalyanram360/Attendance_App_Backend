const mongoose = require("mongoose");
// Each attendance entry for each date
const attendanceEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  present: { type: Boolean, default: false },
});

// Each student row
const studentAttendanceSchema = new mongoose.Schema({
  rollNo: { type: String, required: true },
  attendance: [attendanceEntrySchema], // Array of date → present/absent
});

// Each subject contains attendance table
const subjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  students: [studentAttendanceSchema], // Roll numbers with attendance
});

// Section level: contains many subjects
const sectionSchema = new mongoose.Schema({
  sectionName: { type: String, required: true },
  subjects: [subjectSchema],
});

// Branch level
const branchSchema = new mongoose.Schema({
  branchName: { type: String, required: true },
  sections: [sectionSchema],
});

// Year level (Top Level)
const yearSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  branches: [branchSchema],
});

// Final Model
const Attendance = mongoose.model("Attendance", yearSchema);
module.exports = Attendance;

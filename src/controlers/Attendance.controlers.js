import express from "express";
import Attendance from "../models/attendance.model.js";

const postAttendance = async (req, res) => {
  try {
    const { year, branch, section, subject, date, attendance } = req.body;

    if (!year || !branch || !section || !subject || !date || !attendance) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let record = await Attendance.findOne({ year, branch, section, subject });

    // If no document exists → create new
    if (!record) {
      record = new Attendance({
        year,
        branch,
        section,
        subject,
        students: [],
      });
    }

    const attendanceDate = new Date(date);

    attendance.forEach(({ rollNumber, present }) => {
      let student = record.students.find((s) => s.rollNumber === rollNumber);

      if (!student) {
        // New student entry
        student = {
          rollNumber,
          attendance: [],
        };
        record.students.push(student);
      }

      // Check if attendance for this date exists
      const existingDate = student.attendance.find(
        (a) => a.date.toDateString() === attendanceDate.toDateString()
      );

      if (existingDate) {
        existingDate.present = present; // Update present/absent
      } else {
        student.attendance.push({ date: attendanceDate, present });
      }
    });

    await record.save();

    res.json({ message: "Attendance updated successfully", record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { year, branch, section, subject, date, from, to } = req.query;

    if (!year || !branch || !section || !subject) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const record = await Attendance.findOne({ year, branch, section, subject });

    if (!record) {
      return res.status(404).json({ error: "No attendance found" });
    }

    let result;

    if (date) {
      // Single date filter
      const filterDate = new Date(date);

      result = record.students.map((student) => ({
        rollNumber: student.rollNumber,
        attendance: student.attendance.filter(
          (a) => a.date.toDateString() === filterDate.toDateString()
        ),
      }));
    } else if (from && to) {
      // Date range filter
      const fromDate = new Date(from);
      const toDate = new Date(to);

      result = record.students.map((student) => ({
        rollNumber: student.rollNumber,
        attendance: student.attendance.filter(
          (a) => a.date >= fromDate && a.date <= toDate
        ),
      }));
    } else {
      // No date filter → return all attendance
      result = record.students;
    }

    res.json({
      year,
      branch,
      section,
      subject,
      students: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

export default { postAttendance, getAttendance };

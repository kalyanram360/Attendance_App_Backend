const Attendance = require("../models/Attendance.js");

const postAttendance = async (req, res) => {
  try {
    const { year, branch, section, subject, date, attendance } = req.body;

    if (!year || !branch || !section || !subject || !date || !attendance) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let yearDoc = await Attendance.findOne({ year: year });
    if (!yearDoc) {
      yearDoc = new Attendance({ year: year, branches: [] });
    }

    let branchDoc = yearDoc.branches.find((b) => b.branchName === branch);
    if (!branchDoc) {
      branchDoc = { branchName: branch, sections: [] };
      yearDoc.branches.push(branchDoc);
    }

    let sectionDoc = branchDoc.sections.find((s) => s.sectionName === section);
    if (!sectionDoc) {
      sectionDoc = { sectionName: section, subjects: [] };
      branchDoc.sections.push(sectionDoc);
    }

    let subjectDoc = sectionDoc.subjects.find((s) => s.subjectName === subject);
    if (!subjectDoc) {
      subjectDoc = { subjectName: subject, students: [] };
      sectionDoc.subjects.push(subjectDoc);
    }

    const attendanceDate = new Date(date);

    // Loop through the attendance data sent from the Android app
    attendance.forEach(({ rollNumber, present }) => {
      // ----- THIS IS THE FIX -----
      // Find a student using the correct schema field: `rollNo`
      let student = subjectDoc.students.find((s) => s.rollNo === rollNumber);

      if (!student) {
        // If the student doesn't exist in this subject's list, create them
        student = {
          rollNo: rollNumber, // Create the new student object with the correct field name
          attendance: [],
        };
        subjectDoc.students.push(student);
      }

      // Check if an attendance entry for this specific date already exists
      const existingDate = student.attendance.find(
        (a) => a.date.toDateString() === attendanceDate.toDateString()
      );

      if (existingDate) {
        existingDate.present = present; // Update if it exists
      } else {
        student.attendance.push({ date: attendanceDate, present }); // Add a new entry if it doesn't
      }
    });

    // Save the entire top-level document with all the changes
    await yearDoc.save();

    res.json({ message: "Attendance updated successfully", record: yearDoc });
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

module.exports = { postAttendance, getAttendance };

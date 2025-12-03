const Attendance = require("../models/Attendance.js");

// "/attendance" - POST

// "/attendance" - POST
const postAttendance = async (req, res) => {
  try {
    const { year, branch, section, subject, date, attendance } = req.body;

    if (!year || !branch || !section || !subject || !date || !attendance) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // --- START: CORRECTED LOGIC ---

    // 1. Find or create the top-level Year document
    let yearDoc = await Attendance.findOne({ year: year });
    if (!yearDoc) {
      yearDoc = new Attendance({ year: year, branches: [] });
    }

    // 2. Find or create the Branch document within the Year
    let branchDoc = yearDoc.branches.find((b) => b.branchName === branch);
    if (!branchDoc) {
      branchDoc = { branchName: branch, sections: [] };
      yearDoc.branches.push(branchDoc);
    }

    // 3. Find or create the Section document within the Branch
    let sectionDoc = branchDoc.sections.find((s) => s.sectionName === section);
    if (!sectionDoc) {
      sectionDoc = { sectionName: section, subjects: [] };
      branchDoc.sections.push(sectionDoc);
    }

    // 4. Find or create the Subject document within the Section
    let subjectDoc = sectionDoc.subjects.find((s) => s.subjectName === subject);
    if (!subjectDoc) {
      subjectDoc = { subjectName: subject, students: [] };
      sectionDoc.subjects.push(subjectDoc);
    }

    // --- END: CORRECTED LOGIC ---

    const attendanceDate = new Date(date);

    // Now, `subjectDoc.students` is guaranteed to be an array
    attendance.forEach(({ rollNumber, present }) => {
      // Your Mongoose schema uses `rollNo`, but your request sends `rollNumber`. Let's align them.
      let student = subjectDoc.students.find((s) => s.rollNo === rollNumber);

      if (!student) {
        // New student entry for this subject
        student = {
          rollNo: rollNumber, // Use the schema's field name
          attendance: [],
        };
        subjectDoc.students.push(student);
      }

      // Check if attendance for this date already exists
      const existingDate = student.attendance.find(
        (a) => a.date.toDateString() === attendanceDate.toDateString()
      );

      if (existingDate) {
        existingDate.present = present; // Update if exists
      } else {
        student.attendance.push({ date: attendanceDate, present });
      }
    });

    // Save the entire top-level document
    await yearDoc.save();

    res.json({ message: "Attendance updated successfully", record: yearDoc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = {
  postAttendance,
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

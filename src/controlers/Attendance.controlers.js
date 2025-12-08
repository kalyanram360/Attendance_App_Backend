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

    let branchIndex = yearDoc.branches.findIndex(
      (b) => b.branchName === branch
    );
    if (branchIndex === -1) {
      yearDoc.branches.push({ branchName: branch, sections: [] });
      branchIndex = yearDoc.branches.length - 1;
    }
    let branchDoc = yearDoc.branches[branchIndex]; // Now this is a reference

    // For section
    let sectionIndex = branchDoc.sections.findIndex(
      (s) => s.sectionName === section
    );
    if (sectionIndex === -1) {
      branchDoc.sections.push({ sectionName: section, subjects: [] });
      sectionIndex = branchDoc.sections.length - 1;
    }
    let sectionDoc = branchDoc.sections[sectionIndex]; // Reference

    // For subject
    let subjectIndex = sectionDoc.subjects.findIndex(
      (s) => s.subjectName === subject
    );
    if (subjectIndex === -1) {
      sectionDoc.subjects.push({ subjectName: subject, students: [] });
      subjectIndex = sectionDoc.subjects.length - 1;
    }
    let subjectDoc = sectionDoc.subjects[subjectIndex]; // Reference

    const attendanceDate = new Date(date);

    // Loop through the attendance data sent from the Android app
    attendance.forEach(({ rollNumber, present }) => {
      let studentIndex = subjectDoc.students.findIndex(
        (s) => s.rollNo === rollNumber
      );

      if (studentIndex === -1) {
        // Student doesn't exist - create and push
        subjectDoc.students.push({
          rollNo: rollNumber,
          attendance: [{ date: attendanceDate, present }], // Add attendance immediately
        });
      } else {
        // Student exists - work with the array reference
        let student = subjectDoc.students[studentIndex];

        student.attendance.push({ date: attendanceDate, present });
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

// const getAttendance = async (req, res) => {
//   try {
//     const { year, branch, section, subject, date, from, to } = req.query;

//     if (!year || !branch || !section || !subject) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const record = await Attendance.findOne({ year, branch, section, subject });

//     if (!record) {
//       return res.status(404).json({ error: "No attendance found" });
//     }

//     let result;

//     if (date) {
//       // Single date filter
//       const filterDate = new Date(date);

//       result = record.students.map((student) => ({
//         rollNumber: student.rollNumber,
//         attendance: student.attendance.filter(
//           (a) => a.date.toDateString() === filterDate.toDateString()
//         ),
//       }));
//     } else if (from && to) {
//       // Date range filter
//       const fromDate = new Date(from);
//       const toDate = new Date(to);

//       result = record.students.map((student) => ({
//         rollNumber: student.rollNumber,
//         attendance: student.attendance.filter(
//           (a) => a.date >= fromDate && a.date <= toDate
//         ),
//       }));
//     } else {
//       // No date filter → return all attendance
//       result = record.students;
//     }

//     res.json({
//       year,
//       branch,
//       section,
//       subject,
//       students: result,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server Error" });
//   }
// };
//
const getAttendance = async (req, res) => {
  try {
    const { year, branch, section, subject, date, from, to } = req.query;

    if (!year || !branch || !section || !subject) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const record = await Attendance.aggregate([
      { $match: { year: Number(year) } },
      { $unwind: "$branches" },
      { $match: { "branches.branchName": branch } }, // Changed: branchName is inside branches
      { $unwind: "$branches.sections" },
      { $match: { "branches.sections.sectionName": section } },
      { $unwind: "$branches.sections.subjects" },
      { $match: { "branches.sections.subjects.subjectName": subject } },
      {
        $project: {
          _id: 0,
          year: 1,
          branch: "$branches.branchName",
          section: "$branches.sections.sectionName",
          subject: "$branches.sections.subjects.subjectName",
          students: "$branches.sections.subjects.students",
        },
      },
    ]);

    if (!record.length) {
      return res.status(404).json({ error: "Attendance Not Found" });
    }

    let students = record[0].students;

    // Single date filter
    if (date) {
      const filterDate = new Date(date).toDateString();
      students = students.map((s) => ({
        rollNumber: s.rollNo, // ✅ Changed: rollNo from schema
        attendance: s.attendance.filter(
          (a) => new Date(a.date).toDateString() === filterDate
        ),
      }));
    }
    // Date range filter
    else if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      students = students.map((s) => ({
        rollNumber: s.rollNo, // ✅ Changed: rollNo from schema
        attendance: s.attendance.filter(
          (a) => new Date(a.date) >= fromDate && new Date(a.date) <= toDate
        ),
      }));
    }
    // No filter - return all
    else {
      students = students.map((s) => ({
        rollNumber: s.rollNo, // ✅ Changed: rollNo from schema
        attendance: s.attendance,
      }));
    }

    res.json({
      year,
      branch,
      section,
      subject,
      students,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
};
module.exports = { postAttendance, getAttendance };

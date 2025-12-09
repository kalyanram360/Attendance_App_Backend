const NewClass = require("../models/NewClass");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const PastClasses = require("../models/PastClass");
const mongoose = require("mongoose");
const axios = require("axios");

/**
 * Create a new class with teacher and students
 * @route POST /api/class/create
 */
//comitted a message "everything is working fine" before chamges

const createClass = async (req, res) => {
  try {
    const { teacherEmail, subject, token, sections } = req.body;
    // sections = [{ year, branch, section }, { year, branch, section }, ...]

    // Input validation
    if (
      !teacherEmail ||
      !subject ||
      !token ||
      !sections ||
      !Array.isArray(sections) ||
      sections.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Required fields: teacherEmail, subject, token, sections (array)",
        data: null,
      });
    }

    // Find teacher by email
    const teacher = await Teacher.findOne({
      collegeEmail: teacherEmail.toLowerCase().trim(),
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found in database",
        data: null,
      });
    }

    // Check if token already exists
    const existingClass = await NewClass.findOne({ token: token.trim() });

    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: "A class with this token already exists",
        data: null,
      });
    }

    // Group sections by branch
    const branchesMap = new Map();

    for (const sectionData of sections) {
      const { year, branch, section } = sectionData;

      if (!year || !branch || !section) {
        return res.status(400).json({
          success: false,
          message: "Each section must have year, branch, and section",
          data: null,
        });
      }

      // Find students for this section
      const students = await Student.find({
        branch: branch.trim(),
        section: section.trim(),
        year: parseInt(year),
      }).select("rollno name -_id");

      if (students.length === 0) {
        console.warn(`No students found for ${branch}-${section}-${year}`);
      }

      const formattedStudents = students.map((student) => ({
        rollNo: student.rollno,
        name: student.name,
        present: false,
      }));

      // Group by branch
      const branchKey = branch.trim();
      if (!branchesMap.has(branchKey)) {
        branchesMap.set(branchKey, []);
      }

      branchesMap.get(branchKey).push({
        sectionName: section.trim(),
        year: parseInt(year),
        students: formattedStudents,
      });
    }

    // Convert map to branches array
    const branches = Array.from(branchesMap.entries()).map(
      ([branchName, sections]) => ({
        branchName,
        sections,
      })
    );

    // Create new class
    const newClass = new NewClass({
      teacher: {
        name: teacher.name,
        email: teacher.collegeEmail,
      },
      token: token.trim(),
      subject: subject.trim(),
      branches,
    });

    await newClass.save();

    // Calculate total students
    const totalStudents = branches.reduce(
      (sum, branch) =>
        sum +
        branch.sections.reduce(
          (sSum, section) => sSum + section.students.length,
          0
        ),
      0
    );

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: {
        classId: newClass._id,
        token: newClass.token,
        teacher: newClass.teacher,
        subject: subject.trim(),
        totalStudents,
        branches,
      },
    });
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during class creation",
      data: null,
      error: error.message,
    });
  }
};

/**
 * GET /api/class/current?branch=CSE&section=A&year=3
 * Returns the most recent class (if any) that contains the branch/section/year.
 */
const getCurrentClass = async (req, res) => {
  try {
    const { branch, section, year } = req.query;
    if (!branch || !section || !year) {
      return res.status(400).json({
        success: false,
        message: "branch, section and year are required",
      });
    }

    const numericYear = parseInt(year, 10);
    // Define what "ongoing" means. Here we treat classes created within the last 6 hours as ongoing.
    const ongoingWindowMs = 6 * 60 * 60 * 1000;
    const since = new Date(Date.now() - ongoingWindowMs);

    // Find a class that contains that branch and a section with the given name and year
    const found = await NewClass.findOne({
      createdAt: { $gte: since },
      branches: {
        $elemMatch: {
          branchName: branch.trim(),
          sections: {
            $elemMatch: {
              sectionName: section.trim(),
              year: numericYear,
            },
          },
        },
      },
    }).select("-__v");

    if (!found) {
      return res.status(200).json({
        success: true,
        exists: false,
        data: null,
        message: "No ongoing class found",
      });
    }

    // Optional: you can extract only the matched branch/section on the client.
    return res.status(200).json({ success: true, exists: true, data: found });
  } catch (err) {
    console.error("GET /api/class/current error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * Mark a student present by class token and roll number
 * @route PATCH /api/class/mark/:token/:rollNo
 */
const markStudentPresent = async (req, res) => {
  try {
    const { token, rollNo } = req.params;
    if (!token || !rollNo) {
      return res.status(400).json({
        success: false,
        message: "Token and rollNo are required",
        data: null,
      });
    }

    const classDoc = await NewClass.findOne({ token: token.trim() });
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
        data: null,
      });
    }

    const decodedRoll = decodeURIComponent(rollNo).trim();
    let studentFound = null;

    // Search through branches -> sections -> students
    for (const branch of classDoc.branches) {
      for (const section of branch.sections) {
        const student = section.students.find((s) => s.rollNo === decodedRoll);
        if (student) {
          student.present = true;
          studentFound = {
            rollNo: student.rollNo,
            name: student.name,
            present: student.present,
            branch: branch.branchName,
            section: section.sectionName,
            year: section.year,
            Subject: classDoc.subject,
            Teacher: classDoc.teacher.name,
          };
          break;
        }
      }
      if (studentFound) break;
    }

    if (!studentFound) {
      return res.status(404).json({
        success: false,
        message: "Student with given roll number not found in this class",
        data: null,
      });
    }

    await classDoc.save();

    return res.status(200).json({
      success: true,
      message: "Student marked present",
      data: {
        token: classDoc.token,
        student: studentFound,
      },
    });
  } catch (error) {
    console.error("Mark student present error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while marking student present",
      data: null,
    });
  }
};

// ...existing code...
const resolveClassLookup = (param) => {
  if (!param) return null;
  const v = decodeURIComponent(String(param)).trim();
  if (mongoose.Types.ObjectId.isValid(v)) return { _id: v };
  return { token: v };
};

/**
 * Get all branches and students for a given class token or id
 * supports routes: GET /api/class/:token/branches  AND  GET /api/class/branches/:classId
 */
const getClassBranches = async (req, res) => {
  try {
    const param = req.params.token || req.params.classId;
    if (!param) {
      return res.status(400).json({
        success: false,
        message: "Token/classId is required",
        data: null,
      });
    }

    const query = resolveClassLookup(param);
    const classDoc = await NewClass.findOne(query).select("-__v");
    if (!classDoc)
      return res
        .status(404)
        .json({ success: false, message: "Class not found", data: null });

    const branchesData = classDoc.branches.map((branch) => ({
      branchName: branch.branchName,
      totalSections: branch.sections.length,
      sections: branch.sections.map((section) => {
        const presentCount = section.students.filter(
          (s) => s.present === true
        ).length;
        return {
          sectionName: section.sectionName,
          year: section.year,
          totalStudents: section.students.length,
          presentStudents: presentCount,
          absentStudents: section.students.length - presentCount,
          students: section.students.map((student) => ({
            rollNo: student.rollNo,
            name: student.name,
            present: student.present,
          })),
        };
      }),
    }));

    return res.status(200).json({
      success: true,
      message: "Class branches and students retrieved successfully",
      data: {
        classId: classDoc._id,
        token: classDoc.token,
        teacher: classDoc.teacher,
        branches: branchesData,
      },
    });
  } catch (error) {
    console.error("Get class branches error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching branches",
      data: null,
    });
  }
};

/**
 * Get attendance summary for a class token
 * @route GET /api/class/attendance-summary/:token
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
        data: null,
      });
    }

    const classDoc = await NewClass.findOne({
      token: token.trim(),
    }).select("-__v");

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
        data: null,
      });
    }

    let totalStudents = 0;
    let totalPresent = 0;

    const branchesSummary = classDoc.branches.map((branch) => {
      let branchTotal = 0;
      let branchPresent = 0;

      const sectionsSummary = branch.sections.map((section) => {
        const presentCount = section.students.filter(
          (s) => s.present === true
        ).length;
        const sectionTotal = section.students.length;
        const attendancePercentage =
          sectionTotal > 0
            ? ((presentCount / sectionTotal) * 100).toFixed(2)
            : 0;

        branchTotal += sectionTotal;
        branchPresent += presentCount;
        totalStudents += sectionTotal;
        totalPresent += presentCount;

        return {
          sectionName: section.sectionName,
          year: section.year,
          total: sectionTotal,
          present: presentCount,
          absent: sectionTotal - presentCount,
          attendancePercentage: parseFloat(attendancePercentage),
        };
      });

      const branchAttendancePercentage =
        branchTotal > 0 ? ((branchPresent / branchTotal) * 100).toFixed(2) : 0;

      return {
        branchName: branch.branchName,
        total: branchTotal,
        present: branchPresent,
        absent: branchTotal - branchPresent,
        attendancePercentage: parseFloat(branchAttendancePercentage),
        sections: sectionsSummary,
      };
    });

    const overallAttendancePercentage =
      totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(2) : 0;

    return res.status(200).json({
      success: true,
      message: "Attendance summary retrieved successfully",
      data: {
        classId: classDoc._id,
        token: classDoc.token,
        teacher: classDoc.teacher,
        overall: {
          totalStudents: totalStudents,
          presentStudents: totalPresent,
          absentStudents: totalStudents - totalPresent,
          attendancePercentage: parseFloat(overallAttendancePercentage),
        },
        branches: branchesSummary,
      },
    });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching attendance summary",
      data: null,
    });
  }
};

/**
 * Archive a class into PastClasses collection
 * Accepts either a full `classObject` in the request body or a `token`/`classId` to look up
 * @route POST /api/class/archive
 */
const archiveClass = async (req, res) => {
  try {
    // Accept either a JSON class object or token/classId
    let classObject = req.body.classObject;
    const lookupParam = req.body.token || req.body.classId;

    if (!classObject && !lookupParam) {
      return res.status(400).json({
        success: false,
        message:
          "Provide either `classObject` in body or `token`/`classId` to lookup",
        data: null,
      });
    }

    if (!classObject && lookupParam) {
      const query = resolveClassLookup(lookupParam);
      classObject = await NewClass.findOne(query).lean();
      if (!classObject) {
        return res
          .status(404)
          .json({ success: false, message: "Class not found", data: null });
      }
    }

    // Ensure we have an object now
    if (!classObject) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid class data", data: null });
    }

    // Prevent duplicate past entry by token if available
    const tokenValue = classObject.token || String(classObject._id || "");
    if (tokenValue) {
      const existingPast = await PastClasses.findOne({
        token: tokenValue.trim(),
      });
      if (existingPast) {
        return res.status(409).json({
          success: false,
          message: "This class is already archived",
          data: null,
        });
      }
    }

    // Build past class doc
    const pastDoc = new PastClasses({
      teacher: classObject.teacher || { name: "", email: "" },
      token: tokenValue.trim() || undefined,
      subject: classObject.subject || "",
      branches: classObject.branches || [],
      completedAt: new Date(),
    });

    await pastDoc.save();

    // Delete the original NewClass after archiving.
    // If tokenValue is an ObjectId, delete by _id, otherwise delete by token.
    if (tokenValue) {
      if (mongoose.Types.ObjectId.isValid(tokenValue)) {
        await NewClass.deleteOne({ _id: tokenValue });
      } else {
        await NewClass.deleteOne({ token: tokenValue });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Class archived to PastClasses",
      data: pastDoc,
    });
  } catch (error) {
    console.error("Archive class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while archiving class",
      data: null,
    });
  }
};

//delete class by token
const deleteClassByToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
        data: null,
      });
    }
    const deletedClass = await NewClass.findOneAndDelete({
      token: token.trim(),
    });
    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
        data: null,
      });
    }
    return res.status(200).json({
      success: true,
      message: "Class deleted successfully",
      data: deletedClass,
    });
  } catch (error) {
    console.error("Delete class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting class",
      data: null,
    });
  }
};
// ...existing code...

module.exports = {
  createClass,
  getCurrentClass,
  markStudentPresent,
  getClassBranches,
  getAttendanceSummary,
  archiveClass,
  deleteClassByToken,
};

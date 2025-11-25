const NewClass = require("../models/NewClass");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");

/**
 * Create a new class with teacher and students
 * @route POST /api/class/create
 */
const createClass = async (req, res) => {
  try {
    const { teacherEmail, branch, section, year, token } = req.body;

    // Input validation
    if (!teacherEmail || !branch || !section || !year || !token) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: teacherEmail, branch, section, year, token",
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
    const existingClass = await NewClass.findOne({
      token: token.trim(),
    });

    if (existingClass) {
      return res.status(409).json({
        success: false,
        message: "A class with this token already exists",
        data: null,
      });
    }

    // Find students matching the criteria
    const students = await Student.find({
      branch: branch.trim(),
      section: section.trim(),
      year: parseInt(year),
    }).select("rollno name -_id");

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No students found for branch: ${branch}, section: ${section}, year: ${year}`,
        data: null,
      });
    }

    // Format students for NewClass schema
    const formattedStudents = students.map((student) => ({
      rollNo: student.rollno,
      name: student.name,
      present: false,
    }));

    // Create new class
    const newClass = new NewClass({
      teacher: {
        name: teacher.name,
        email: teacher.collegeEmail,
      },
      token: token.trim(),
      branches: [
        {
          branchName: branch.trim(),
          sections: [
            {
              sectionName: section.trim(),
              year: parseInt(year),
              students: formattedStudents,
            },
          ],
        },
      ],
    });

    await newClass.save();

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: {
        classId: newClass._id,
        token: newClass.token,
        teacher: newClass.teacher,
        branch: branch.trim(),
        section: section.trim(),
        year: parseInt(year),
        totalStudents: formattedStudents.length,
        students: formattedStudents,
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
    const ongoingWindowMs = 144 * 60 * 60 * 1000;
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

module.exports = {
  createClass,
  getCurrentClass,
};

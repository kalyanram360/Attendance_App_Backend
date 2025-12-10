const Teacher = require("../models/Teacher");

// ...existing code...

/**
 * Register a new teacher
 * @route POST /api/teacher/register
 */
const registerTeacher = async (req, res) => {
  try {
    const { collegeEmail, department, name } = req.body;

    // Input validation
    if (!collegeEmail || !department || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: collegeEmail, department, name",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(collegeEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        data: null,
      });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      collegeEmail: collegeEmail.toLowerCase().trim(),
    });

    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Teacher with this email already exists",
        data: null,
      });
    }

    // Create new teacher
    const newTeacher = new Teacher({
      collegeEmail: collegeEmail.toLowerCase().trim(),
      department: department.trim(),
      name: name.trim(),
    });

    await newTeacher.save();

    return res.status(201).json({
      success: true,
      message: "Teacher registered successfully",
      data: {
        teacherId: newTeacher._id,
        name: newTeacher.name,
        collegeEmail: newTeacher.collegeEmail,
        department: newTeacher.department,
      },
    });
  } catch (error) {
    console.error("Teacher registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during teacher registration",
      data: null,
    });
  }
};

/**
 * Get all teachers
 * @route GET /api/teachers
 */
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully",
      data: {
        count: teachers.length,
        teachers,
      },
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching teachers",
      data: null,
    });
  }
};

/**
 * Check if teacher exists and verify activation code
 * @route GET /api/teacher/check/:collegeEmail/:activationCode
 */
const checkTeacher = async (req, res) => {
  try {
    const { collegeEmail, activationCode } = req.params;

    if (!collegeEmail) {
      return res.status(400).json({
        success: false,
        message: "College email is required",
        exists: false,
        data: null,
      });
    }

    // Verify activation code
    const expectedCode = process.env.ACT_TEACHER || "GVP123";
    if (activationCode && activationCode.trim() !== expectedCode.trim()) {
      return res.status(401).json({
        success: false,
        message: "Invalid activation code",
        exists: false,
        data: null,
      });
    }

    // Find teacher by email
    const teacher = await Teacher.findOne({
      collegeEmail: decodeURIComponent(collegeEmail).toLowerCase().trim(),
    }).select("-__v");

    if (teacher) {
      return res.status(200).json({
        success: true,
        message: "Teacher found and verified",
        exists: true,
        data: teacher,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Teacher not found in database",
        exists: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Check teacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during teacher check",
      exists: false,
      data: null,
    });
  }
};

module.exports = {
  registerTeacher,
  getAllTeachers,
  checkTeacher,
};

const Student = require("../models/Student");

// ...existing code...

/**
 * Register a new student
 * @route POST /api/student/register
 */
const registerStudent = async (req, res) => {
  try {
    const { collegeEmail, branch, name, section, rollno, year } = req.body;

    // Input validation
    if (!collegeEmail || !branch || !name || !section || !rollno || !year) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: collegeEmail, branch, name, section, rollno, year",
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

    // Check if student already exists
    const existingStudent = await Student.findOne({
      collegeEmail: collegeEmail.toLowerCase().trim(),
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "Student with this email already exists",
        data: null,
      });
    }

    // Create new student
    const newStudent = new Student({
      collegeEmail: collegeEmail.toLowerCase().trim(),
      branch: branch.trim(),
      name: name.trim(),
      section: section.trim(),
      rollno: rollno.trim(),
      year: parseInt(year),
    });

    await newStudent.save();

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      data: {
        studentId: newStudent._id,
        name: newStudent.name,
        collegeEmail: newStudent.collegeEmail,
        rollno: newStudent.rollno,
      },
    });
  } catch (error) {
    console.error("Student registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during student registration",
      data: null,
    });
  }
};

/**
 * Get all students
 * @route GET /api/students
 */
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully",
      data: {
        count: students.length,
        students,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching students",
      data: null,
    });
  }
};

/**
 * Check if student exists and verify activation code
 * @route GET /api/student/check/:collegeEmail/:activationCode
 */
const checkStudent = async (req, res) => {
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
    const expectedCode = process.env.ACT_STUDENT || "GVP123";
    if (activationCode && activationCode.trim() !== expectedCode.trim()) {
      return res.status(401).json({
        success: false,
        message: "Invalid activation code",
        exists: false,
        data: null,
      });
    }

    // Find student by email
    const student = await Student.findOne({
      collegeEmail: decodeURIComponent(collegeEmail).toLowerCase().trim(),
    }).select("-__v");

    if (student) {
      return res.status(200).json({
        success: true,
        message: "Student found and verified",
        exists: true,
        data: student,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Student not found in database",
        exists: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Check student error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during student check",
      exists: false,
      data: null,
    });
  }
};

//check students along with activation code
const checkStudentWithActivation = async (req, res) => {
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
    const expectedCode = process.env.ACT_STUDENT || "GVP123";
    if (activationCode && activationCode.trim() !== expectedCode.trim()) {
      return res.status(401).json({
        success: false,
        message: "Invalid activation code",
        exists: false,
        data: null,
      });
    }
    // Find student by email
    const student = await Student.findOne({
      collegeEmail: decodeURIComponent(collegeEmail).toLowerCase().trim(),
    }).select("-__v");
    if (student) {
      return res.status(200).json({
        success: true,
        message: "Student found and verified",
        exists: true,
        data: student,
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Student not found in database",
        exists: false,
        data: null,
      });
    }
  } catch (error) {
    console.error("Check student error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during student check",
      exists: false,
      data: null,
    });
  }
};

module.exports = {
  registerStudent,
  checkStudent,
  getAllStudents,
  checkStudentWithActivation,
};

//
//kalyan

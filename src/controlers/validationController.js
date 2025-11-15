const College = require("../models/College");

/**
 * Validate college details
 * @route POST /api/validate
 */
const validateCollege = async (req, res) => {
  try {
    const { collegeEmail, collegeName, activationCode } = req.body;

    // Input validation
    if (!collegeEmail || !collegeName || !activationCode) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: collegeEmail, collegeName, activationCode",
        data: null,
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(collegeEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
        data: null,
      });
    }

    // Find college with matching details
    const college = await College.findOne({
      collegeEmail: collegeEmail.toLowerCase().trim(),
      collegeName: collegeName.trim(),
      activationCode: activationCode.trim(),
      isActive: true,
    });

    if (college) {
      // Update last validated timestamp
      college.lastValidated = new Date();
      await college.save();

      return res.status(200).json({
        success: true,
        message: "College details validated successfully",
        data: {
          collegeId: college._id,
          collegeName: college.collegeName,
          validated: true,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message:
          "Invalid college details. Please check your email, college name, and activation code.",
        data: {
          validated: false,
        },
      });
    }
  } catch (error) {
    console.error("Validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during validation",
      data: null,
    });
  }
};

/**
 * Register a new college (for admin/testing purposes)
 * @route POST /api/register
 */
const registerCollege = async (req, res) => {
  try {
    const { collegeEmail, collegeName, activationCode } = req.body;

    if (!collegeEmail || !collegeName || !activationCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        data: null,
      });
    }

    // Check if college already exists
    const existingCollege = await College.findOne({
      $or: [
        { collegeEmail: collegeEmail.toLowerCase().trim() },
        { activationCode: activationCode.trim() },
      ],
    });

    if (existingCollege) {
      return res.status(409).json({
        success: false,
        message: "College with this email or activation code already exists",
        data: null,
      });
    }

    // Create new college
    const newCollege = new College({
      collegeEmail: collegeEmail.toLowerCase().trim(),
      collegeName: collegeName.trim(),
      activationCode: activationCode.trim(),
    });

    await newCollege.save();

    return res.status(201).json({
      success: true,
      message: "College registered successfully",
      data: {
        collegeId: newCollege._id,
        collegeName: newCollege.collegeName,
        collegeEmail: newCollege.collegeEmail,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      data: null,
    });
  }
};

/**
 * Get all colleges (for admin/testing purposes)
 * @route GET /api/colleges
 */
const getAllColleges = async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true })
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Colleges retrieved successfully",
      data: {
        count: colleges.length,
        colleges,
      },
    });
  } catch (error) {
    console.error("Get colleges error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching colleges",
      data: null,
    });
  }
};

module.exports = {
  validateCollege,
  registerCollege,
  getAllColleges,
};

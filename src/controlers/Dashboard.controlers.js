const Student = require("../models/Student");
const PastClasses = require("../models/PastClass");

/**
 * Get student dashboard data
 * @route GET /api/student/dashboard
 * @query {string} rollNo - Student roll number
 * @query {string} collegeEmail - Student college email
 */
const getStudentDashboard = async (req, res) => {
  try {
    const { rollNo, collegeEmail } = req.query;

    // Validate input
    if (!rollNo && !collegeEmail) {
      return res.status(400).json({
        success: false,
        message: "Either rollNo or collegeEmail is required",
        data: null,
      });
    }

    // Find student
    let student;
    if (collegeEmail) {
      student = await Student.findOne({
        collegeEmail: collegeEmail.toLowerCase().trim(),
      });
    } else {
      student = await Student.findOne({ rollno: rollNo.trim() });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
        data: null,
      });
    }

    // Find all past classes for this student's branch, section, and year
    const pastClasses = await PastClasses.find({
      "branches.branchName": student.branch,
      "branches.sections.sectionName": student.section,
      "branches.sections.year": student.year,
    });

    // Calculate attendance statistics
    let totalClasses = 0;
    let classesAttended = 0;
    let consecutivePresent = 0;
    let currentStreak = 0;
    let lastClassDate = null;
    let totalFailedTokens = 0;
    const attendanceHistory = [];

    // Process each past class
    for (const pastClass of pastClasses) {
      for (const branch of pastClass.branches) {
        if (branch.branchName === student.branch) {
          for (const section of branch.sections) {
            if (
              section.sectionName === student.section &&
              section.year === student.year
            ) {
              // Find this student in the class
              const studentRecord = section.students.find(
                (s) => s.rollNo === student.rollno
              );

              if (studentRecord) {
                totalClasses++;
                const isPresent = studentRecord.present;
                const failedTokens = studentRecord.failedTokens || 0;

                if (isPresent) {
                  classesAttended++;
                }

                totalFailedTokens += failedTokens;

                // Store attendance history for streak calculation
                attendanceHistory.push({
                  date: pastClass.completedAt,
                  present: isPresent,
                  failedTokens: failedTokens,
                });
              }
            }
          }
        }
      }
    }

    // Sort attendance history by date (most recent first)
    attendanceHistory.sort((a, b) => b.date - a.date);

    // Calculate current streak (consecutive recent attendances)
    for (const record of attendanceHistory) {
      if (record.present) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate attendance percentage
    const attendancePercentage =
      totalClasses > 0 ? (classesAttended / totalClasses) * 100 : 0;

    // Calculate consistency (attendance rate over last 10 classes)
    const recentClasses = attendanceHistory.slice(0, 10);
    const recentAttended = recentClasses.filter((r) => r.present).length;
    const consistency =
      recentClasses.length > 0 ? recentAttended / recentClasses.length : 0;

    // Calculate engagement score (0-100)
    // Lower failed tokens = higher engagement
    // Formula: 100 - (average failed tokens per class * 10)
    // Capped between 0 and 100
    const avgFailedTokensPerClass =
      totalClasses > 0 ? totalFailedTokens / totalClasses : 0;
    const engagementScore = Math.max(
      0,
      Math.min(100, 100 - avgFailedTokensPerClass * 10)
    );

    // Prepare response
    const dashboardData = {
      student: {
        name: student.name,
        rollNo: student.rollno,
        branch: student.branch,
        section: student.section,
        year: student.year,
      },
      attendance: {
        totalClasses,
        classesAttended,
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        currentStreak,
        consistency: parseFloat(consistency.toFixed(2)),
        totalFailedTokens,
        avgFailedTokensPerClass: parseFloat(avgFailedTokensPerClass.toFixed(2)),
        engagementScore: parseFloat(engagementScore.toFixed(2)),
      },
    };

    return res.status(200).json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error in getStudentDashboard:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      data: null,
    });
  }
};

module.exports = {  
  getStudentDashboard,
};

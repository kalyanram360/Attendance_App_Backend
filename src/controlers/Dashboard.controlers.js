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
    const subjectWiseAttendance = {};
    const monthlyAttendance = {};
    const weeklyPattern = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const weeklyPresent = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };

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
                const subject = pastClass.subject;
                const classDate = new Date(pastClass.completedAt);

                if (isPresent) {
                  classesAttended++;
                }

                totalFailedTokens += failedTokens;

                // Subject-wise tracking
                if (!subjectWiseAttendance[subject]) {
                  subjectWiseAttendance[subject] = {
                    total: 0,
                    attended: 0,
                    failedTokens: 0,
                  };
                }
                subjectWiseAttendance[subject].total++;
                if (isPresent) subjectWiseAttendance[subject].attended++;
                subjectWiseAttendance[subject].failedTokens += failedTokens;

                // Monthly tracking
                const monthKey = `${classDate.getFullYear()}-${String(classDate.getMonth() + 1).padStart(2, "0")}`;
                if (!monthlyAttendance[monthKey]) {
                  monthlyAttendance[monthKey] = { total: 0, attended: 0 };
                }
                monthlyAttendance[monthKey].total++;
                if (isPresent) monthlyAttendance[monthKey].attended++;

                // Weekly pattern tracking
                const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const dayName = dayNames[classDate.getDay()];
                weeklyPattern[dayName]++;
                if (isPresent) weeklyPresent[dayName]++;

                // Store attendance history for streak calculation
                attendanceHistory.push({
                  date: pastClass.completedAt,
                  present: isPresent,
                  failedTokens: failedTokens,
                  subject: subject,
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

    // Subject-wise analysis
    const subjectAnalysis = Object.entries(subjectWiseAttendance).map(
      ([subject, data]) => ({
        subject,
        totalClasses: data.total,
        attended: data.attended,
        percentage: parseFloat(((data.attended / data.total) * 100).toFixed(2)),
        avgFailedTokens: parseFloat((data.failedTokens / data.total).toFixed(2)),
        status:
          (data.attended / data.total) * 100 >= 75
            ? "good"
            : (data.attended / data.total) * 100 >= 65
            ? "warning"
            : "critical",
      })
    );

    // Sort by percentage to find best and worst subjects
    const sortedSubjects = [...subjectAnalysis].sort(
      (a, b) => b.percentage - a.percentage
    );
    const bestSubject = sortedSubjects[0] || null;
    const worstSubject = sortedSubjects[sortedSubjects.length - 1] || null;

    // Monthly trend analysis
    const monthlyTrend = Object.entries(monthlyAttendance)
      .map(([month, data]) => ({
        month,
        totalClasses: data.total,
        attended: data.attended,
        percentage: parseFloat(((data.attended / data.total) * 100).toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Weekly attendance pattern
    const weeklyAttendancePattern = Object.entries(weeklyPattern).map(
      ([day, total]) => ({
        day,
        totalClasses: total,
        attended: weeklyPresent[day],
        percentage: total > 0 ? parseFloat(((weeklyPresent[day] / total) * 100).toFixed(2)) : 0,
      })
    );

    // Recent performance trend (last 5 vs previous 5 classes)
    const last5Classes = attendanceHistory.slice(0, 5);
    const previous5Classes = attendanceHistory.slice(5, 10);
    const last5Attendance = last5Classes.filter((c) => c.present).length;
    const previous5Attendance = previous5Classes.filter((c) => c.present).length;
    const trendDirection =
      last5Attendance > previous5Attendance
        ? "improving"
        : last5Attendance < previous5Attendance
        ? "declining"
        : "stable";

    // Risk assessment
    let riskLevel = "low";
    let riskMessage = "Your attendance is on track!";
    if (attendancePercentage < 65) {
      riskLevel = "critical";
      riskMessage = "Critical! Your attendance is below 65%. Immediate action required.";
    } else if (attendancePercentage < 75) {
      riskLevel = "high";
      riskMessage = "Warning! Your attendance is below 75%. You need to improve.";
    } else if (attendancePercentage < 85) {
      riskLevel = "moderate";
      riskMessage = "Your attendance is decent but could be better.";
    }

    // Classes needed to reach 75% (if below)
    let classesNeededFor75 = 0;
    if (attendancePercentage < 75) {
      // Formula: (classesAttended + x) / (totalClasses + x) = 0.75
      // Solving for x: x = (0.75 * totalClasses - classesAttended) / 0.25
      classesNeededFor75 = Math.ceil(
        (0.75 * totalClasses - classesAttended) / 0.25
      );
    }

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
      insights: {
        trend: {
          direction: trendDirection,
          last5Classes: last5Attendance,
          previous5Classes: previous5Attendance,
        },
        risk: {
          level: riskLevel,
          message: riskMessage,
          classesNeededFor75:
            classesNeededFor75 > 0 ? classesNeededFor75 : null,
        },
        bestPerformingSubject: bestSubject,
        worstPerformingSubject: worstSubject,
      },
      analytics: {
        subjectWise: subjectAnalysis,
        monthlyTrend,
        weeklyPattern: weeklyAttendancePattern,
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

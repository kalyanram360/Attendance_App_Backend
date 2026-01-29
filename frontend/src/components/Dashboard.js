import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rollNo, setRollNo] = useState('323103382020');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:5000/api/student/dashboard?rollNo=${rollNo}`
      );
      setStudentData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!studentData) return null;

  const { student, attendance, insights, analytics } = studentData;

  // Colors for charts
  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  // Risk level colors
  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-green-100 text-green-800 border-green-500',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-500',
      high: 'bg-orange-100 text-orange-800 border-orange-500',
      critical: 'bg-red-100 text-red-800 border-red-500',
    };
    return colors[level] || colors.low;
  };

  // Status colors for subjects
  const getStatusColor = (status) => {
    const colors = {
      good: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.good;
  };

  // Prepare data for pie chart
  const attendancePieData = [
    { name: 'Attended', value: attendance.classesAttended },
    { name: 'Missed', value: attendance.totalClasses - attendance.classesAttended },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header with Search */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Student Attendance Dashboard
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Enter Roll Number"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition shadow-lg hover:shadow-xl"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Student Info Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">{student.name}</h2>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                  {student.rollNo}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                  {student.branch}
                </span>
                <span>Section: {student.section}</span>
                <span>Year: {student.year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Attendance"
            value={`${attendance.attendancePercentage}%`}
            subtitle={`${attendance.classesAttended}/${attendance.totalClasses} classes`}
            color="blue"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            }
          />
          <MetricCard
            title="Engagement Score"
            value={attendance.engagementScore}
            subtitle={`Avg ${attendance.avgFailedTokensPerClass} failed tokens`}
            color="green"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          />
          <MetricCard
            title="Current Streak"
            value={`${attendance.currentStreak} 🔥`}
            subtitle="Consecutive attendances"
            color="orange"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            }
          />
          <MetricCard
            title="Consistency"
            value={`${(attendance.consistency * 100).toFixed(0)}%`}
            subtitle="Last 10 classes"
            color="purple"
            icon={
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            }
          />
        </div>

        {/* Risk Assessment */}
        <div className={`rounded-2xl shadow-xl p-6 border-l-4 ${getRiskColor(insights.risk.level)}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Risk Assessment</h3>
              <p className="text-lg mb-2">{insights.risk.message}</p>
              {insights.risk.classesNeededFor75 && (
                <p className="font-semibold">
                  Need to attend {insights.risk.classesNeededFor75} consecutive classes to reach 75%
                </p>
              )}
            </div>
            <span className="px-4 py-2 rounded-full font-bold text-sm uppercase">
              {insights.risk.level}
            </span>
          </div>
        </div>

        {/* Trend & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Performance Trend</h3>
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <p className="text-gray-600">Last 5 Classes</p>
                <p className="text-3xl font-bold text-blue-600">{insights.trend.last5Classes}</p>
              </div>
              <div className="text-4xl">
                {insights.trend.direction === 'improving' && '📈'}
                {insights.trend.direction === 'declining' && '📉'}
                {insights.trend.direction === 'stable' && '➡️'}
              </div>
              <div className="text-center flex-1">
                <p className="text-gray-600">Previous 5 Classes</p>
                <p className="text-3xl font-bold text-gray-600">{insights.trend.previous5Classes}</p>
              </div>
            </div>
            <div className="text-center">
              <span className={`px-4 py-2 rounded-full font-semibold ${
                insights.trend.direction === 'improving' ? 'bg-green-100 text-green-800' :
                insights.trend.direction === 'declining' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {insights.trend.direction.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best & Worst Subjects */}
        {insights.bestPerformingSubject && insights.worstPerformingSubject && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border-2 border-green-500">
              <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
                <span>🏆</span> Best Performing Subject
              </h3>
              <p className="text-2xl font-bold text-green-900">{insights.bestPerformingSubject.subject}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {insights.bestPerformingSubject.percentage}%
              </p>
              <p className="text-green-700 mt-1">
                {insights.bestPerformingSubject.attended}/{insights.bestPerformingSubject.totalClasses} classes
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-xl p-6 border-2 border-orange-500">
              <h3 className="text-xl font-bold text-orange-800 mb-3 flex items-center gap-2">
                <span>⚠️</span> Needs Improvement
              </h3>
              <p className="text-2xl font-bold text-orange-900">{insights.worstPerformingSubject.subject}</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {insights.worstPerformingSubject.percentage}%
              </p>
              <p className="text-orange-700 mt-1">
                {insights.worstPerformingSubject.attended}/{insights.worstPerformingSubject.totalClasses} classes
              </p>
            </div>
          </div>
        )}

        {/* Subject-wise Analysis */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Subject-wise Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.subjectWise.map((subject, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-gray-800 truncate">{subject.subject}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subject.status)}`}>
                    {subject.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Attendance:</span>
                    <span className="font-semibold text-gray-800">
                      {subject.attended}/{subject.totalClasses}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        subject.percentage >= 75 ? 'bg-green-500' :
                        subject.percentage >= 65 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Percentage:</span>
                    <span className="font-bold text-lg">{subject.percentage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Failed Tokens:</span>
                    <span className="font-semibold">{subject.avgFailedTokens}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        {analytics.monthlyTrend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Monthly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Attendance %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekly Pattern Chart */}
        {analytics.weeklyPattern.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Weekly Attendance Pattern</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.weeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attended" fill="#10b981" name="Attended" />
                <Bar dataKey="totalClasses" fill="#6b7280" name="Total Classes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Metric Card Component
const MetricCard = ({ title, value, subtitle, color, icon }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl shadow-xl p-6 text-white`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide opacity-90">{title}</h3>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-4xl font-bold mb-1">{value}</p>
      <p className="text-sm opacity-90">{subtitle}</p>
    </div>
  );
};

export default Dashboard;

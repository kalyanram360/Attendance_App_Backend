const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    present: {
      type: Boolean,
      default: false,
    },
    failedTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false },
);

const SectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    students: {
      type: [StudentSchema],
      default: [],
    },
  },
  { _id: true },
);

const BranchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    sections: {
      type: [SectionSchema],
      default: [],
    },
  },
  { _id: true },
);

const PastClassesSchema = new mongoose.Schema(
  {
    teacher: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    branches: {
      type: [BranchSchema],
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
PastClassesSchema.index({ "teacher.email": 1 });

module.exports = mongoose.model("PastClasses", PastClassesSchema);

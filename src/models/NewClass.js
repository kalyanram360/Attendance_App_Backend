// models/NewClass.js
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
  { _id: false }
); // don't create subdocument _id for each student unless you want it

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
  { _id: true }
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
  { _id: true }
);

const NewClassSchema = new mongoose.Schema(
  {
    teacher: {
      name: { type: String, trim: true, required: true },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [
          /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "Please provide a valid email address",
        ],
      },
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    branches: {
      type: [BranchSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Optional: convenience instance method to find a section quickly
NewClassSchema.methods.findSection = function (branchName, sectionName, year) {
  const branch = this.branches.find((b) => b.branchName === branchName);
  if (!branch) return null;
  return (
    branch.sections.find(
      (s) => s.sectionName === sectionName && s.year === year
    ) || null
  );
};

module.exports = mongoose.model("NewClass", NewClassSchema);

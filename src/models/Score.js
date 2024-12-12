const mongoose = require("mongoose")

const LevelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalScore: {
      type: Number,
      default: 10,
    },
    isCompleted: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
)

const ScoreSchema = new mongoose.Schema(
  {
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
      unique: true,
    },
    levels: {
      type: [LevelSchema],
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Score", ScoreSchema)

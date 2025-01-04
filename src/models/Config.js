const mongoose = require("mongoose")

const uniquelevelSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
    },
    starsRequired: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

const starSchema = new mongoose.Schema(
  {
    star: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

const gemsSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

const ConfigSchema = new mongoose.Schema(
  {
    questionPrompt: {
      type: String,
      trim: true,
    },
    categoryPrompt: {
      type: String,
      trim: true,
    },
    subcategoryPrompt: {
      type: String,
      trim: true,
    },
    gamePlanPrompt: {
      type: String,
      trim: true,
    },
    levels: {
      type: [uniquelevelSchema],
    },
    stars: {
      type: [starSchema],
    },
    gems: {
      type: [gemsSchema],
    },
    baseXp: {
      type: Number,
    },
    multiplayerMultiplier: {
      type: Number,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Config", ConfigSchema)

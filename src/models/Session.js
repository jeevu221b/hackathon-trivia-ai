const mongoose = require("mongoose")

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    level: {
      type: Number,
      required: false,
    },
    levelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    score: {
      type: Number,
      default: 0,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Session", SessionSchema)

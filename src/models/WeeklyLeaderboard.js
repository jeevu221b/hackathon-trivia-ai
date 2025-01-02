const mongoose = require("mongoose")

const usersSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    score: {
      type: Number,
      required: true,
    },
    stars: {
      type: Number,
      required: true,
    },
    climbedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
)

const WeeklyLeaderboardSchema = new mongoose.Schema(
  {
    endsAt: {
      type: Date,
      required: true,
    },
    users: [usersSchema],
    climbedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
)
module.exports = mongoose.model("WeeklyLeaderboard", WeeklyLeaderboardSchema)

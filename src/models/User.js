const mongoose = require("mongoose")

const recentlyPlayedSchema = new mongoose.Schema(
  {
    categories: {
      type: Array,
    },
  },
  { timestamps: true }
)

const watchListSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
})

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    firstLogin: {
      type: Boolean,
      default: true,
    },
    xp: {
      type: Number,
      default: 0,
    },
    gems: {
      type: Number,
      default: 2,
    },
    recentlyPlayed: {
      type: [recentlyPlayedSchema],
    },
    title: {
      type: Number,
      default: 0,
    },
    watchlist: {
      type: [watchListSchema],
    },
    watchedList: {
      type: [watchListSchema],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("User", UserSchema)

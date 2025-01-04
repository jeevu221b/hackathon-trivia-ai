const mongoose = require("mongoose")

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
  },
  { timestamps: true }
)

module.exports = mongoose.model("User", UserSchema)

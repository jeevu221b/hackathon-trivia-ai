const mongoose = require("mongoose")

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    subtext: {
      type: String,
      trim: true,
      default: "",
    },
    isBanner: {
      type: Boolean,
      default: false,
    },
    displayName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Category", CategorySchema)

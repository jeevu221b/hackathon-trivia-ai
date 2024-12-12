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
    },
    subtext: {
      type: String,
      trim: true,
    },
    isBanner: {
      type: Boolean,
    },
    displayName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Category", CategorySchema)

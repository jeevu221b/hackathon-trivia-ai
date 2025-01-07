const mongoose = require("mongoose")
const metaDataSchema = require("./MetadataSchema")

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
    shelf: {
      type: Number,
      default: 2,
    },
    type: {
      type: String,
      default: "All",
    },
    metaData: metaDataSchema,
  },
  { timestamps: true }
)

module.exports = mongoose.model("Category", CategorySchema)

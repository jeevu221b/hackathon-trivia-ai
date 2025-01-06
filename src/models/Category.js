const mongoose = require("mongoose")

const metaDataSchema = new mongoose.Schema({
  type: {
    type: String,
    trim: true,
    default: "",
  },
  imageSrc: {
    type: String,
    trim: true,
    default: "",
  },
  wikiTitle: {
    type: String,
    trim: true,
    default: "",
  },
  platform: {
    type: String,
    trim: true,
    default: "",
  },
  platformLink: {
    type: String,
    trim: true,
    default: "",
  },
  showInfo: {
    type: Boolean,
    default: false,
  },

})

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
    metaData:{
      type: [metaDataSchema],
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Category", CategorySchema)

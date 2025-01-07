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

const SubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    facts: {
      type: Array,
    },
    metaData: metaDataSchema,
  },
  { timestamps: true }
)

module.exports = mongoose.model("Subcategory", SubcategorySchema)

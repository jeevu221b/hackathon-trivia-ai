const mongoose = require("mongoose")
const metaDataSchema = require("./MetadataSchema")

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

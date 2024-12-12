const mongoose = require("mongoose")

const MovieSchema = new mongoose.Schema(
  {
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    movies: {
      type: [String],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Movie", MovieSchema)

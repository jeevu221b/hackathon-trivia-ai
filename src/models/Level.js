const mongoose = require("mongoose")

const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v.length >= 2
        },
        message: "A question must not have more than 4 choices",
      },
    },
    answer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    image: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "audio", "video"],
    },
  },
  { timestamps: true }
)

const LevelSchema = new mongoose.Schema(
  {
    questions: {
      type: [QuestionSchema],
      required: true,
    },
    image: {
      type: String,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Level", LevelSchema)

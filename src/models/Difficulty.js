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
  },
  { timestamps: true }
)

const DifficultySchema = new mongoose.Schema(
  {
    prompt: {
      type: String,
      trim: true,
    },
    level: {
      type: [Number],
      required: true,
    },
    questions: {
      type: [QuestionSchema],
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Difficulty", DifficultySchema)

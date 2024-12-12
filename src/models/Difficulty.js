const moongoose = require("mongoose")

const DifficultySchema = new moongoose.Schema(
  {
    prompt: {
      type: String,
      trim: true,
    },
    level: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = moongoose.model("Difficulty", DifficultySchema)

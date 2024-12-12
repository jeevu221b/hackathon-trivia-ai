const mongoose = require("mongoose")

const celebPromptSchema = new mongoose.Schema(
  {
    prompt1: {
      type: String,
      trim: true,
    },
    prompt2: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

const franchisePromptSchema = new mongoose.Schema(
  {
    prompt1: {
      type: String,
      trim: true,
    },
    prompt2: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

const PromptSchema = new mongoose.Schema(
  {
    mainPrompt: {
      type: String,
      trim: true,
    },
    celebPrompt: {
      type: [celebPromptSchema],
    },
    franchisePrompt: {
      type: [franchisePromptSchema],
    },
  },
  { timestamps: true }
)
module.exports = mongoose.model("Prompt", PromptSchema)

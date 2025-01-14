const mongoose = require("mongoose")

const limitSchema = new mongoose.Schema({
  minQuestions: {
    type: Number,
    default: null,
  },
  maxQuestions: {
    type: Number,
    default: null,
  },
  minPoints: {
    type: Number,
    default: null,
  },
  maxPoints: {
    type: Number,
    default: null,
  },
})

const valueSchema = new mongoose.Schema({
  time: {
    type: Number,
  },
  score: {
    type: Number,
  },
  option: {
    type: Number,
  },
  retry: {
    type: Number,
  },
  betPercentage: {
    type: Number,
  },
})

const cardUiSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  description: {
    type: String,
    default: "description",
  },
  cooldown: {
    type: String,
    default: "",
  },
  uses: {
    type: String,
    default: "",
  },
  rarity: {
    type: String,
    default: "",
  },
  backgroundColor: {
    type: String,
    default: "",
  },
  imageName: {
    type: String,
    default: "",
  },
})

const CardSchema = new mongoose.Schema(
  {
    cardUi: {
      type: cardUiSchema,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    ability: {
      type: String, // description of the card's ability, e.g., "Remove two options"
      required: true,
    },
    rarity: {
      type: Number, // e.g., 1 for common, 5 for legendary
      enum: [1, 2, 3, 4, 5],
      required: true,
    },
    cooldown: {
      type: Number, // cooldown period in seconds/minutes
      default: 3600, // default cooldown of 1 hour
      required: true,
    },
    applyType: {
      type: String,
      enum: ["general", "in_game"], // "all" for always active, "on-next-question" for single use
      required: true,
    },
    abilityType: {
      type: String,
      enum: ["time_manipulator", "score_manipulator", "option_remover", "retry", "bet"],
      required: true,
    },
    affectType: {
      type: String,
      enum: ["add", "subtract"],
      required: true,
    },
    appliedTo: {
      type: String,
      enum: ["me", "opponent"],
      required: true,
    },
    maxEarnLimit: {
      type: Number, // Max points/XP/benefit that can be earned before the card goes on cooldown
      default: null, // No max limit if null
    },
    value: {
      type: valueSchema, // Set value as required
      required: true,
    },
    limit: {
      type: limitSchema, // Set limit as required
      required: true,
    },
    minRequiredXP: {
      type: Number,
      default: 0,
      required: true,
    },
    isPowerCard: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Card", CardSchema)

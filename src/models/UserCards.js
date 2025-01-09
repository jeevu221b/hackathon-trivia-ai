const mongoose = require("mongoose")

const cooldownSchema = new mongoose.Schema({
  startedAt: {
    type: Date,
    default: null,
  },
  endsAt: {
    type: Date,
    default: null,
  },
})

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

const UserCardsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    required: true,
  },
  isOnCooldown: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  cooldown: {
    type: cooldownSchema,
    required: true,
  },
  limit: {
    type: limitSchema, // Set limit as required
    required: true,
  },
})

module.exports = mongoose.model("UserCards", UserCardsSchema)

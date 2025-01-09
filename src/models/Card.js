const mongoose = require("mongoose")

// const card = {
//   id: "card123",
//   name: "Time Freeze",
//   appliesTo: "opponent",
//   type: "time-manipulator",
//   ability: "add",
//   value: 5,
// }

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
})

const CardSchema = new mongoose.Schema(
  {
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
      enum: ["time_manipulator", "score_manipulator"],
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
  },
  { timestamps: true }
)

// ChatGpt_Card_Chat - https://chatgpt.com/c/66e06d17-067c-8003-a9f6-2ec557a43645

// const AbilitySchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   remove_options: {
//     type: Number,
//   },
//   usageLimit: {
//     type: Number, // Max number of times the card can be used
//     default: null, // Unlimited usage if null
//   },
//   duration: {
//     type: Number, // Time in seconds for which the card effect lasts (if applicable)
//     default: null, // Null if duration does not apply
//   },
//   revealHint: {
//     type: Boolean,
//     default: false,
//   },
//   secondChance: {
//     type: Boolean,
//     default: false,
//   },
//   doublePoints: {
//     type: Boolean,
//     default: false,
//   },
// })

// const UserCardsSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     cards: [
//       {
//         cardId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Card",
//           required: true,
//         },
//         isOnCooldown: {
//           type: Boolean,
//           default: false,
//         },
//         cooldownEnd: {
//           type: Date,
//           default: null, // when the card can be used again
//         },
//         usesLeft: {
//           type: Number, // optional limit to how many times a card can be used
//           default: null,
//         },
//       },
//     ],
//   },
//   { timestamps: true }
// )

// module.exports = mongoose.model("UserCards", UserCardsSchema)

module.exports = mongoose.model("Card", CardSchema)

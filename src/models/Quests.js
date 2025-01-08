const mongoose = require("mongoose")

const QuestsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
      // required: true,
    },
    xpReward: {
      type: Number,
      default: 5, // XP rewarded for completing the quest
    },
    // gemReward: {
    //   type: Number,
    //   default: 0, // Optional gem reward
    // },
    taskType: {
      type: String,
      enum: ["login", "playGames", "answerQuestions", "dailyBonus"],
      required: true,
    },
    taskRequirement: {
      type: Number,
      default: 1, // For example, how many games to play for the "playGames" task
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // isDaily: {
    //   type: Boolean,
    //   default: true, // Whether the quest is daily or recurring
    // },
    // icon: {
    //   type: String,
    //   default: "", // Optional: an icon for the quest (e.g., a star or trophy)
    // },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Quests", QuestsSchema)

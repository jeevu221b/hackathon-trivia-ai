const Quests = require("../models/Quests")
const User = require("../models/User")

async function createQuest(title, taskType) {
  return await Quests.create({ title, taskType })
}

async function getQuests(userId) {
  try {
    const user = await User.findById(userId, { questProgress: 1 })
    const quests = await Quests.find({}).lean()
    if (!user) {
      throw new Error("User not found")
    }
    const questProgress = []

    for (const userQuest of user.questProgress) {
      const quest = quests.find((q) => q._id.toString() === userQuest.questId.toString())
      if (quest) {
        questProgress.push({
          questId: quest._id,
          title: quest.title,
          taskType: quest.taskType,
          taskRequirement: quest.taskRequirement,
          completedCount: userQuest.completedCount,
          isCompleted: userQuest.isCompleted,
        })
      }
    }
    return questProgress
  } catch (error) {
    console.error(error)
    throw new Error("Error fetching user data")
  }
}

module.exports = { createQuest, getQuests }

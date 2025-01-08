const Quests = require("../models/Quests")

async function createQuest(title, taskType) {
  try {
    return await Quests.create({ title, taskType })
  } catch (error) {
    throw error
  }
  // Create quest
}

module.exports = { createQuest }

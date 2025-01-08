const Quests = require("../models/Quests")

async function createQuest(title, taskType) {
  return await Quests.create({ title, taskType })
  // Create quest
}

module.exports = { createQuest }

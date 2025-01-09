const moment = require("moment")
const Quests = require("../models/Quests")
const User = require("../models/User")
const { updateXp } = require("../utils/helper")

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

async function updateQuestProgress(userId, configs) {
  try {
    const [user, quests] = await Promise.all([User.findOne({ _id: userId }, { questProgress: 1 }), Quests.find({}).lean()])

    // Initialize questProgress if it doesn't exist
    if (!user.questProgress) {
      user.questProgress = []
    }

    // Find the play game quest
    const playGameQuest = quests.find((q) => q.taskType === "playGames")
    let questInUserProgress = user.questProgress.find((quest) => quest.questId.toString() === playGameQuest._id.toString())

    const now = new Date()

    // Create a separate variable to track quest updates
    let questUpdates = []

    if (!questInUserProgress) {
      // If the quest progress doesn't exist, create a new entry
      questInUserProgress = {
        questId: playGameQuest._id,
        completedCount: 1,
        isCompleted: false,
      }
      user.questProgress.push(questInUserProgress)

      // Show quest as active (toShow: true)
      questUpdates = [
        {
          title: playGameQuest.title,
          type: "Play 2 Games",
          progress: questInUserProgress.completedCount,
          total: playGameQuest.taskRequirement,
          xp: 0,
          toShow: true, // Quest is active (not completed)
        },
      ]

      // Check if quest is completed
      if (questInUserProgress.completedCount >= playGameQuest.taskRequirement) {
        await updateXp(userId, playGameQuest.xpReward, configs[0].gems, configs[0].titles)
        questInUserProgress.isCompleted = true
        questUpdates[0].xp = playGameQuest.xpReward
        questUpdates[0].toShow = false // Quest completed, set toShow: false
      }

      await user.save()
    } else {
      const date1 = moment(new Date(questInUserProgress.updatedAt)).startOf("day")
      const date2 = moment(now).startOf("day")

      const dayDifference = date2.diff(date1, "days")

      // Reset quest progress if 24 hours have passed
      if (dayDifference > 0 || !questInUserProgress.isCompleted) {
        if (questInUserProgress.isCompleted) {
          questInUserProgress.isCompleted = false
          questInUserProgress.completedCount = 0
        }

        // Show quest as active again
        questUpdates = [
          {
            title: playGameQuest.title,
            type: "Play 2 Games",
            progress: questInUserProgress.completedCount,
            total: playGameQuest.taskRequirement,
            xp: 0,
            toShow: true, // Reset means it's active again
          },
        ]
      }

      // If the quest is not completed, increment the progress
      if (!questInUserProgress.isCompleted) {
        questInUserProgress.completedCount += 1
        questInUserProgress.isCompleted = questInUserProgress.completedCount >= playGameQuest.taskRequirement

        questUpdates = [
          {
            title: playGameQuest.title,
            type: "Play 2 Games",
            progress: questInUserProgress.completedCount,
            total: playGameQuest.taskRequirement,
            xp: 0,
            toShow: true, // Still active
          },
        ]

        // If quest is completed, update XP and set toShow: false
        if (questInUserProgress.isCompleted) {
          await updateXp(userId, playGameQuest.xpReward, configs[0].gems, configs[0].titles)
          questUpdates[0].xp = playGameQuest.xpReward
          questUpdates[0].toShow = true // Quest is now completed
        }

        await user.save()
      } else {
        // If the quest is already completed, return it but set toShow: false
        questUpdates = [
          {
            title: playGameQuest.title,
            type: "Play 2 Games",
            progress: questInUserProgress.completedCount,
            total: playGameQuest.taskRequirement,
            xp: 0,
            toShow: false, // Completed quest, so set toShow: false
          },
        ]
      }
    }

    // Return the updated quest data
    return questUpdates
  } catch (error) {
    console.log(error)
    throw new Error(error)
  }
}

async function dailyLoginQuestProgress(userId, quests, configs) {
  const user = await User.findOne({ _id: userId }, { questProgress: 1 })
  if (!user.questProgress) {
    user.questProgress = []
  }

  // Find the play game quest
  const loginQuest = quests.find((q) => q.taskType === "login")
  let dailyLoginQuest = user.questProgress.find((quest) => quest.questId.toString() === loginQuest._id.toString())

  const now = new Date()

  // Create a separate variable to track quest updates
  let questUpdates = []

  if (!dailyLoginQuest) {
    // If the quest progress doesn't exist, create a new entry
    dailyLoginQuest = {
      questId: loginQuest._id,
      completedCount: 1,
      isCompleted: true,
    }
    user.questProgress.push(dailyLoginQuest)

    // Show quest as active (toShow: true)
    const updatedXp = await updateXp(userId, loginQuest.xpReward, configs[0].gems, configs[0].titles)
    questUpdates = [
      {
        title: loginQuest.title,
        type: "login",
        progress: dailyLoginQuest.completedCount,
        total: loginQuest.taskRequirement,
        xp: updatedXp.xp,
        toShow: true, // Quest is active (not completed)
      },
    ]
    await user.save()
  } else if (dailyLoginQuest) {
    const date1 = moment(dailyLoginQuest.updatedAt).startOf("day")
    const date2 = moment(now).startOf("day")

    // calculate the difference in days, ignoring the time
    const dayDifference = date2.diff(date1, "days")

    // Reset quest progress if 24 hours have passed
    if (parseInt(dayDifference) > 0) {
      dailyLoginQuest.completedCount = 1 // Increment completed count
      dailyLoginQuest.isCompleted = true
      dailyLoginQuest.updatedAt = now
      const updatedXp = await updateXp(userId, loginQuest.xpReward, configs[0].gems, configs[0].titles)
      questUpdates = [
        {
          title: loginQuest.title,
          type: "login",
          progress: dailyLoginQuest.completedCount,
          total: loginQuest.taskRequirement,
          xp: updatedXp.xp,
          toShow: true, // Quest is active (not completed)
        },
      ]
      await user.save()
    }
  }
  if (questUpdates.length == 0) {
    questUpdates = [
      {
        title: loginQuest.title,
        type: "login",
        progress: dailyLoginQuest.completedCount,
        total: loginQuest.taskRequirement,
        xp: 0,
        toShow: false, // Quest is active (not completed)
      },
    ]
  }
  return questUpdates
}

module.exports = { createQuest, getQuests, updateQuestProgress, dailyLoginQuestProgress }

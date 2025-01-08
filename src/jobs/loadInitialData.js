const Category = require("../models/Category")
const SubCategory = require("../models/Subcategory")
const Config = require("../models/Config")
const Level = require("../models/Level")
const Score = require("../models/Score")

// eslint-disable-next-line no-unused-vars
const { ObjectId } = require("mongodb")
const { scoreToStarsConverter, getSubcategoryScore, sortCategory } = require("../utils/helper")
const Difficulty = require("../models/Difficulty")
const User = require("../models/User")
const { metadataDefault } = require("./helper")
const Quests = require("../models/Quests")

async function loadInitialData(userId, multiplayer, firstLogin) {
  const bigData = { categories: [], subcategories: [], levels: [], questions: [], quest: [] }
  const [categories, levels, scores, configs, subcategories, user, quests] = await Promise.all([
    Category.find({}).lean(),
    Level.find({}, { questions: 0 }).lean(),
    Score.find({}).lean(),
    Config.find({}).lean(),
    SubCategory.find({}).lean(),
    User.findOne({ _id: userId }, { watchedList: 1, watchlist: 1, questProgress: 1 }),
    Quests.find({}).lean(),
  ])
  let totalScore = 0

  // If first login
  // Check if daily login quest exists or not
  // If it doesn't exists then
  //   _id:.completedCount += 1
  //  if (loginQuest.completedCount >= loginQuest.taskRequirement) {
  //    loginQuest.isCompleted = true
  //    user.xp += loginQuest.xpReward
  //    user.gems += loginQuest.gemReward
  //  }
  // If it exists then check it is completed or not

  // ---------- Actual Implementation -----------------------
  // Assume 'user' is already defined and fetched from the database
  const now = new Date()
  const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  if (!user.lastDailyLogin || now - new Date(user.lastDailyLogin) > twentyFourHours) {
    console.log("More than 24 hrs")
    user.lastDailyLogin = now

    // Initialize questProgress if it doesn't exist
    if (!user.questProgress) {
      user.questProgress = []
    }

    // Iterate over quests and push completed ones
    for (let quest of quests) {
      if (quest.taskType === "login") {
        user.questProgress.push({
          questId: quest._id,
          completedCount: 1,
          isCompleted: true,
        })
        bigData["quest"].push({ title: quest.title, type: quest.taskType, progress: user.questProgress.completedCount, total: quest.taskRequirement, xp: quest.xpReward })
      }
    }

    // Save the updated user document
    await user.save()
  }

  const sortedCategories = sortCategory(categories)
  for (let category of sortedCategories) {
    bigData["categories"].push({
      id: category._id,
      name: category.name,
      image: category.image ? category.image : "category.png",
      isBanner: category.isBanner,
      displayName: category.displayName,
      subtext: category.subtext,
      new: category.createdAt > new Date(new Date().setDate(new Date().getDate() - 10)),
      shelf: category.shelf ? category.shelf : 2,
      type: category.type,
      createdAt: category.createdAt,
      theme: category.theme,
      metaData: category.metaData
        ? { ...category.metaData, isWatched: hasWatched(user, category._id, true), inWatchlist: hasWatched(user, category._id, false), userCount: category.metaData.userCount || 0 }
        : { ...metadataDefault },
    })
  }

  for (let subcategory of subcategories) {
    bigData["subcategories"].push({
      id: subcategory._id,
      category: subcategory.category,
      name: subcategory.name,
      image: subcategory.image ? subcategory.image : "subcategory.png",
      facts: subcategory.facts,
      score: await getSubcategoryScore(subcategory._id, userId),
      new: subcategory.updatedAt > new Date(new Date().setDate(new Date().getDate() - 7)),
      metaData: subcategory.metaData
        ? {
            ...subcategory.metaData,
            isWatched: hasWatched(user, subcategory._id, true),
            inWatchlist: hasWatched(user, subcategory._id, false),
            userCount: subcategory.metaData.userCount || 0,
          }
        : metadataDefault,
    })
  }

  if (firstLogin) {
    const { questions } = await Difficulty.findOne({}, { questions: 1 }).lean()
    bigData["questions"] = questions
  }

  if (multiplayer === true) {
    for (const score of scores) {
      for (const userData of score.levels) {
        if (userData.userId.equals(userId)) {
          bigData["levels"].push({
            level: userData.level,
            id: userData.levelId,
            isUnlocked: true,
            isCompleted: true,
            subCategory: score.subcategory,
            // image: level.image,
            score: userData.score,
            star: await scoreToStarsConverter(userData.score),
          })
        }
      }
    }

    for (const level of levels) {
      const index = bigData["levels"].findIndex((data) => {
        return data.id.toString() == level._id.toString()
      })

      if (index === -1) {
        bigData["levels"].push({ level: level.level, id: level._id, isUnlocked: true, subCategory: level.subcategory, image: level.image })
      }
    }
  } else {
    for (const score of scores) {
      let insideTracker = 0
      for (const userData of score.levels) {
        insideTracker += 1
        const index = levels.findIndex((level) => level._id.equals(userData.levelId) && userData.userId.equals(userId))
        if (index !== -1) {
          const level = levels[index]
          bigData["levels"].push({
            level: level.level,
            id: level._id,
            isUnlocked: true,
            isCompleted: true,
            subCategory: level.subcategory,
            image: level.image,
            score: userData.score,
            star: await scoreToStarsConverter(userData.score),
          })
          const uniqLevel = configs[0].levels.filter((item) => item.level === level.level + 1)[0]
          if (score.levels.length == insideTracker && !uniqLevel) {
            let levelId = await Level.findOne({ subcategory: level.subcategory, level: level.level + 1 }, { _id: 1 }).lean()
            if (levelId) {
              bigData["levels"].push({ level: level.level + 1, id: levelId._id, isUnlocked: true, subCategory: level.subcategory, image: levelId.image })
            }
          }
        }
      }
    }
    for (const level of levels) {
      const existingLevelIndex = bigData["levels"].findIndex((data) => data.id.equals(level._id))
      if (existingLevelIndex === -1) {
        totalScore = 0
        const isUniqueLevel = configs[0].levels.filter((item) => item.level === level.level)[0]
        const score = scores.filter((_score) => _score.subcategory.equals(level.subcategory))[0]
        if (isUniqueLevel && score) {
          const user = score.levels.filter((_score) => _score.userId.equals(userId))
          for (const userLevel of user) {
            totalScore += await scoreToStarsConverter(userLevel.score)
          }
        }
        if (level.level === 1 || level.level === 2 || (isUniqueLevel && totalScore >= isUniqueLevel.starsRequired)) {
          bigData["levels"].push({ level: level.level, id: level._id, isUnlocked: true, subCategory: level.subcategory, image: level.image })
        } else {
          if (!bigData["levels"].includes(level._id)) {
            bigData["levels"].push({ level: level.level, id: level._id, isUnlocked: false, subCategory: level.subcategory, image: level.image })
          }
        }
      }
    }
  }
  return bigData
}

function hasWatched(user, id, isWatchedList) {
  try {
    // Fetch user data with only watchedList field
    const list = user[isWatchedList ? "watchedList" : "watchlist"]
    // Check if the ID exists in the list
    return list.some((item) => item.id.toString() === id.toString())
  } catch (error) {
    console.error("Error in hasWatched function:", error)
    return false
  }
}

module.exports = { loadInitialData, hasWatched }

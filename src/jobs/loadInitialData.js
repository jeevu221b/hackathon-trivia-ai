const Category = require("../models/Category")
const SubCategory = require("../models/Subcategory")
const Config = require("../models/Config")
const Level = require("../models/Level")
const Score = require("../models/Score")

// eslint-disable-next-line no-unused-vars
const { ObjectId } = require("mongodb")
const { scoreToStarsConverter, getSubcategoryScore } = require("../utils/helper")

async function loadInitialData(userId, multiplayer) {
  const bigData = { categories: [], subcategories: [], levels: [] }
  const categories = await Category.find({}).lean()
  const levels = await Level.find({}, { questions: 0 }).lean()
  const scores = await Score.find({}).lean()
  const configs = await Config.find({}).lean()
  const subcategories = await SubCategory.find({}).lean()
  let totalScore = 0

  for (let category of categories) {
    bigData["categories"].push({
      id: category._id,
      name: category.name,
      image: category.image ? category.image : "category.png",
      isBanner: category.isBanner,
      displayName: category.displayName,
      subtext: category.subtext,
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
    })
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

module.exports = { loadInitialData }

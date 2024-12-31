const Session = require("../models/Session")
const Level = require("../models/Level")
const Score = require("../models/Score")
const { scoreToStarsConverter, getLevelInfo, addScoreToLeaderboard, addUserToLeaderboard, leaderboardClimbing } = require("../utils/helper")
const Config = require("../models/Config")
const Leaderboard = require("../models/Leaderboard")
const { SESSION_ALREADY_COMPLETED, INVALID_SESSION_ID, INVALID_LEVEL } = require("../config/errorLang")

async function createSession(userId, levelId, multiplayer) {
  if (multiplayer) {
    const session = await Session.create({ userId: userId, isActive: true, isCompleted: false })
    return session._id
  }
  const level = await Level.findById({ _id: levelId }, { level: 1 })
  if (!level) {
    throw new Error(INVALID_LEVEL)
  }
  const sessionData = {
    userId: userId,
    level: level.level,
    levelId: levelId,
    isActive: true,
    isCompleted: false,
  }
  const session = await Session.create(sessionData)
  return session._id
}

async function updateSession(sessionId, score, isCompleted) {
  let nextUnlockedLevelInfo = {}
  const configs = await Config.find({}).lean()
  const beforeUpdating = await Session.findByIdAndUpdate(sessionId).lean()
  if (beforeUpdating.isCompleted) {
    throw new Error(SESSION_ALREADY_COMPLETED)
  }
  const updated = await Session.findByIdAndUpdate(sessionId, { score: score, ...(!isCompleted ? { isActive: false } : {}), isCompleted }, { new: true }).lean()
  if (!updated) {
    throw new Error(INVALID_SESSION_ID)
  }
  const oldLeaderBoard = (await Leaderboard.findOne({}, { users: 1, _id: 0 })).users.sort((a, b) => b.score - a.score)
  updated.requiredStars = ""
  const level = await Level.findOne({ _id: updated.levelId }, { subcategory: 1, level: 1 }).lean()
  const levels = await Level.find({ subcategory: level.subcategory }).lean()
  if (updated.isCompleted) {
    const existingScore = await Score.findOne(
      {
        subcategory: level.subcategory,
        levels: {
          $elemMatch: {
            userId: updated.userId,
            levelId: updated.levelId,
          },
        },
      },
      {
        "levels.$": 1,
      }
    ).lean()

    if (existingScore) {
      if (score > existingScore.levels[0].score) {
        updated.isBestScore = true
        await Score.findOneAndUpdate(
          {
            subcategory: level.subcategory,
          },
          {
            $set: {
              "levels.$[elem].score": updated.score,
              "levels.$[elem].isCompleted": updated.isCompleted,
            },
          },
          {
            new: true,
            arrayFilters: [
              {
                "elem.userId": updated.userId,
                "elem.levelId": updated.levelId,
              },
            ],
          }
        )
        await addScoreToLeaderboard(updated.userId, score - existingScore.levels[0].score)
      } else {
        updated.isBestScore = false
      }
    } else {
      // Insert new document
      await Score.updateOne(
        {
          subcategory: level.subcategory,
        },
        {
          $addToSet: {
            levels: {
              userId: updated.userId,
              levelId: updated.levelId,
              level: updated.level,
              score: updated.score,
              isCompleted: updated.isCompleted,
            },
          },
        },
        {
          upsert: true,
        }
      )
      const doesUserExistInLeaderBoard = oldLeaderBoard.findIndex((user) => user.user.equals(updated.userId))
      if (doesUserExistInLeaderBoard == -1) {
        await addUserToLeaderboard(updated.userId, updated.score)
      } else {
        await addScoreToLeaderboard(updated.userId, updated.score)
      }
    }
  }
  const leaderboard = await leaderboardClimbing(updated.userId, oldLeaderBoard)
  const scores = await Score.findOne({
    subcategory: level.subcategory,
    "levels.userId": updated.userId,
  })
  const doesNextLevelExists = levels.findIndex((item) => item.level == updated.level + 1)
  if (doesNextLevelExists != -1) {
    updated.doesNextLevelExist = true
    updated.nextLevelId = levels[doesNextLevelExists]._id
    const isUniqueLevel = configs[0].levels.filter((item) => item.level === updated.level + 1)[0]
    const hasPlayedNextLevel = scores.levels.findIndex((l) => l.level == updated.level + 1 && l.isCompleted)
    if (hasPlayedNextLevel != -1) {
      updated.isNextLevelUnlocked = true
    } else if (isUniqueLevel) {
      let totalScore = 0
      const user = scores.levels.filter((_score) => _score.userId.equals(updated.userId))
      for (const userLevel of user) {
        totalScore += await scoreToStarsConverter(userLevel.score)
      }
      if (isUniqueLevel.starsRequired - totalScore > 0) {
        updated.requiredStars = `Score ${isUniqueLevel.starsRequired - totalScore} more ${isUniqueLevel.starsRequired - totalScore > 1 ? "stars" : "star"} to unlock the next level!`
        updated.isNextLevelUnlocked = false
      }
    } else {
      updated.isNextLevelUnlocked = true
    }
    if (updated.isNextLevelUnlocked) {
      nextUnlockedLevelInfo = { level: updated.level + 1, id: updated.nextLevelId, isUnlocked: true, isCompleted: false, subCategory: level.subcategory, score: 0, star: 0 }
    }
  } else {
    updated.doesNextLevelExist = false
    updated.nextLevelId = ""
  }
  updated.subcategory = level.subcategory
  updated.star = await scoreToStarsConverter(updated.score)
  const levelInfo = await getLevelInfo(updated.userId, level.subcategory)
  if (updated.isNextLevelUnlocked) {
    levelInfo.levels.push(nextUnlockedLevelInfo)
  }
  updated.levels = levelInfo.levels
  updated.leaderboard = leaderboard
  return updated
}

async function expireSession(sessionId) {
  return await Session.findByIdAndUpdate(sessionId, { isActive: false })
}

module.exports = { createSession, expireSession, updateSession }

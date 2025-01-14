const Session = require("../models/Session")
const Level = require("../models/Level")
const Score = require("../models/Score")
const {
  scoreToStarsConverter,
  getLevelInfo,
  updateLeaderboard,
  updateScore,
  resetWeeklyLeaderBoard,
  addUserToWeeklyLeaderBoardWinners,
  getCategoryId,
  addRecentlyPlayedCategory,
  getUnlockedLevel,
} = require("../utils/helper")
const Config = require("../models/Config")
const { SESSION_ALREADY_COMPLETED, INVALID_SESSION_ID, INVALID_LEVEL, INVALID_SCORE } = require("../config/errorLang")
const WeeklyLeaderboard = require("../models/WeeklyLeaderboard")
const { weeklyLeaderboardClimbing, updateWeeklyLeaderboard } = require("../utils/leaderBoardHelper")
const { updateQuestProgress } = require("./quests")

async function createSession(userId, levelId, multiplayer) {
  if (multiplayer) {
    const session = await Session.create({ userId: userId, isActive: true, isCompleted: false })
    return session._id
  }
  const level = await Level.findById({ _id: levelId }, { level: 1 })
  if (!level) {
    throw new Error(INVALID_LEVEL)
  }

  const session = await Session.create({
    userId,
    level: level.level,
    levelId,
    isActive: true,
    isCompleted: false,
  })
  return session._id
}

async function updateSession(sessionId, score, isCompleted, streak, testing = false) {
  const session = await Session.findById(sessionId).lean()
  if (!session) {
    throw new Error(INVALID_SESSION_ID)
  }
  if (session.isCompleted && !testing) {
    throw new Error(SESSION_ALREADY_COMPLETED)
  }

  if (score > 10 || score < 0) {
    throw new Error(INVALID_SCORE)
  }
  if (streak) {
    if (typeof streak !== "number" || streak < 0 || streak > 20) {
      console.log("Invalid streak")
      streak = 0
    }
  }

  const updatedSession = await Session.findByIdAndUpdate(sessionId, { score: score, ...(!isCompleted ? { isActive: false } : {}), isCompleted }, { new: true }).lean()
  if (!updatedSession) {
    throw new Error(INVALID_SESSION_ID)
  }

  const oldWeeklyLeaderBoard = (await WeeklyLeaderboard.findOne({}, { users: 1, _id: 0 }))?.users.sort((a, b) => b.score - a.score)
  if (!oldWeeklyLeaderBoard) {
    await resetWeeklyLeaderBoard()
  }

  updatedSession.requiredStars = ""
  const level = await Level.findOne({ _id: updatedSession.levelId }, { subcategory: 1, level: 1 }).lean()
  const levels = await Level.find({ subcategory: level.subcategory }).lean()
  const configs = await Config.find({}).lean()
  const categoryId = await getCategoryId(level.subcategory)
  await addRecentlyPlayedCategory(updatedSession.userId, categoryId)
  let userInfo
  if (updatedSession.isCompleted) {
    // Update the score in the Score collection
    let { isBestScore, score, stars, xpAndGem } = await updateScore(
      level.subcategory,
      updatedSession.userId,
      updatedSession.levelId,
      updatedSession,
      configs[0].gems,
      configs[0].titles,
      configs,
      streak
    )
    updatedSession.isBestScore = isBestScore
    userInfo = xpAndGem

    // Update the score in the Leaderboards
    if (score != -1) {
      await updateLeaderboard(updatedSession.userId, score, stars)
      const weeklyleaderboard = await WeeklyLeaderboard.findOne({}, { _id: 0 }).lean()
      const currentTime = new Date()
      //Update the Weekly Leaderboard
      if (currentTime < weeklyleaderboard.endsAt) {
        await updateWeeklyLeaderboard(updatedSession.userId, score, stars)
      } else {
        await addUserToWeeklyLeaderBoardWinners(weeklyleaderboard)
        await resetWeeklyLeaderBoard()
        await updateWeeklyLeaderboard(updatedSession.userId, score, stars)
      }
    }
  }

  await weeklyLeaderboardClimbing(updatedSession.userId, oldWeeklyLeaderBoard)
  const scores = await Score.findOne({
    subcategory: level.subcategory,
    "levels.userId": updatedSession.userId,
  })
  const doesNextLevelExists = levels.findIndex((item) => item.level == updatedSession.level + 1)
  const nextUnlockedLevel = []
  if (doesNextLevelExists != -1) {
    updatedSession.doesNextLevelExist = true
    updatedSession.nextLevelId = levels[doesNextLevelExists]._id
    const isUniqueLevel = configs[0].levels.filter((item) => item.level === updatedSession.level + 1)[0]
    const hasPlayedNextLevel = scores.levels.findIndex((l) => l.userId.equals(updatedSession.userId) && l.level === updatedSession.level + 1 && l.isCompleted)
    if (hasPlayedNextLevel != -1) {
      updatedSession.isNextLevelUnlocked = true
    } else if (isUniqueLevel) {
      let totalScore = 0
      const user = scores.levels.filter((_score) => _score.userId.equals(updatedSession.userId))
      for (const userLevel of user) {
        totalScore += await scoreToStarsConverter(userLevel.score, configs)
      }
      if (isUniqueLevel.starsRequired - totalScore > 0) {
        updatedSession.requiredStars = `Score ${isUniqueLevel.starsRequired - totalScore} more ${isUniqueLevel.starsRequired - totalScore > 1 ? "stars" : "star"} to unlock the next level!`
        updatedSession.isNextLevelUnlocked = false
      } else {
        updatedSession.isNextLevelUnlocked = true
        nextUnlockedLevel.push(getUnlockedLevel(updatedSession.level + 1, levels[doesNextLevelExists]._id, level.subcategory))
      }
    } else {
      updatedSession.isNextLevelUnlocked = true
      nextUnlockedLevel.push(getUnlockedLevel(updatedSession.level + 1, levels[doesNextLevelExists]._id, level.subcategory))
    }
  } else {
    updatedSession.doesNextLevelExist = false
    updatedSession.nextLevelId = ""
  }
  updatedSession.subcategory = level.subcategory
  updatedSession.star = await scoreToStarsConverter(updatedSession.score, configs)
  const levelInfo = await getLevelInfo(updatedSession.userId, level.subcategory, scores, nextUnlockedLevel[0], configs)
  updatedSession.levels = levelInfo.levels
  updatedSession.requiredXp = `You need ${userInfo.requiredXp} XP to unlock a gem :D`
  updatedSession.xp = userInfo.xp
  updatedSession.gems = userInfo.gems
  updatedSession.totalXp = userInfo.totalXp
  updatedSession.totalGems = userInfo.totalGems
  updatedSession.quests = await updateQuestProgress(updatedSession.userId, configs)
  return updatedSession
}

async function expireSession(sessionId) {
  return await Session.findByIdAndUpdate(sessionId, { isActive: false })
}

module.exports = { createSession, expireSession, updateSession }

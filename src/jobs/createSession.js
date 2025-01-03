const Session = require("../models/Session")
const Level = require("../models/Level")
const Score = require("../models/Score")
const { scoreToStarsConverter, getLevelInfo, leaderboardClimbing, updateLeaderboard, updateScore, resetWeeklyLeaderBoard, addUserToWeeklyLeaderBoardWinners } = require("../utils/helper")
const Config = require("../models/Config")
const Leaderboard = require("../models/Leaderboard")
const { SESSION_ALREADY_COMPLETED, INVALID_SESSION_ID, INVALID_LEVEL, INVALID_SCORE } = require("../config/errorLang")
const WeeklyLeaderboard = require("../models/WeeklyLeaderboard")
const { weeklyLeaderboardClimbing, updateWeeklyLeaderboard } = require("../utils/leaderBoardHelper")

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

async function updateSession(sessionId, score, isCompleted) {
  const session = await Session.findById(sessionId).lean()
  if (!session) {
    throw new Error(INVALID_SESSION_ID)
  }
  if (session.isCompleted) {
    throw new Error(SESSION_ALREADY_COMPLETED)
  }

  if (score > 10 || score < 0) {
    throw new Error(INVALID_SCORE)
  }

  const updatedSession = await Session.findByIdAndUpdate(sessionId, { score: score, ...(!isCompleted ? { isActive: false } : {}), isCompleted }, { new: true }).lean()
  if (!updatedSession) {
    throw new Error(INVALID_SESSION_ID)
  }

  const oldLeaderBoard = (await Leaderboard.findOne({}, { users: 1, _id: 0 }))?.users.sort((a, b) => b.score - a.score)
  const oldWeeklyLeaderBoard = (await WeeklyLeaderboard.findOne({}, { users: 1, _id: 0 }))?.users.sort((a, b) => b.score - a.score)
  if (!oldWeeklyLeaderBoard) {
    await resetWeeklyLeaderBoard()
  }

  updatedSession.requiredStars = ""
  const level = await Level.findOne({ _id: updatedSession.levelId }, { subcategory: 1, level: 1 }).lean()
  const levels = await Level.find({ subcategory: level.subcategory }).lean()
  if (updatedSession.isCompleted) {
    // Update the score in the Score collection
    let { isBestScore, score, stars } = await updateScore(level.subcategory, updatedSession.userId, updatedSession.levelId, updatedSession)
    updatedSession.isBestScore = isBestScore

    // Update the score in the Leaderboards
    if (score != -1) {
      await updateLeaderboard(updatedSession.userId, score, stars)
      const weeklyleaderboard = await WeeklyLeaderboard.findOne({}, { _id: 0 }).lean()
      const currentTime = new Date()
      //Update the Weekly Leaderboard
      if (currentTime < weeklyleaderboard.endsAt) {
        await updateWeeklyLeaderboard(updatedSession.userId, score, stars)
      } else {
        // await WeeklyLeaderboard.updateOne({}, { endsAt: getNearestFridayStartDate() })
        await addUserToWeeklyLeaderBoardWinners(weeklyleaderboard)
        await resetWeeklyLeaderBoard()
        await updateWeeklyLeaderboard(updatedSession.userId, score, stars)
      }
    }
  }

  const leaderboard = await leaderboardClimbing(updatedSession.userId, oldLeaderBoard)
  const configs = await Config.find({}).lean()
  await weeklyLeaderboardClimbing(updatedSession.userId, oldWeeklyLeaderBoard)
  const scores = await Score.findOne({
    subcategory: level.subcategory,
    "levels.userId": updatedSession.userId,
  })
  const doesNextLevelExists = levels.findIndex((item) => item.level == updatedSession.level + 1)
  if (doesNextLevelExists != -1) {
    updatedSession.doesNextLevelExist = true
    updatedSession.nextLevelId = levels[doesNextLevelExists]._id
    const isUniqueLevel = configs[0].levels.filter((item) => item.level === updatedSession.level + 1)[0]
    const hasPlayedNextLevel = scores.levels.findIndex((l) => l.level == updatedSession.level + 1 && l.isCompleted)
    if (hasPlayedNextLevel != -1) {
      updatedSession.isNextLevelUnlocked = true
    } else if (isUniqueLevel) {
      let totalScore = 0
      const user = scores.levels.filter((_score) => _score.userId.equals(updatedSession.userId))
      for (const userLevel of user) {
        totalScore += await scoreToStarsConverter(userLevel.score)
      }
      if (isUniqueLevel.starsRequired - totalScore > 0) {
        updatedSession.requiredStars = `Score ${isUniqueLevel.starsRequired - totalScore} more ${isUniqueLevel.starsRequired - totalScore > 1 ? "stars" : "star"} to unlock the next level!`
        updatedSession.isNextLevelUnlocked = false
      }
    } else {
      updatedSession.isNextLevelUnlocked = true
    }
  } else {
    updatedSession.doesNextLevelExist = false
    updatedSession.nextLevelId = ""
  }
  updatedSession.subcategory = level.subcategory
  updatedSession.star = await scoreToStarsConverter(updatedSession.score)
  const levelInfo = await getLevelInfo(updatedSession.userId, level.subcategory)
  updatedSession.levels = levelInfo.levels
  updatedSession.leaderboard = leaderboard
  return updatedSession
}

async function expireSession(sessionId) {
  return await Session.findByIdAndUpdate(sessionId, { isActive: false })
}

module.exports = { createSession, expireSession, updateSession }

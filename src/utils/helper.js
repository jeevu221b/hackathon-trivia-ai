// eslint-disable-next-line no-unused-vars
const mongodb = require("mongodb")
const Config = require("../models/Config")
const Subcategory = require("../models/Subcategory")
const Difficulty = require("../models/Difficulty")
const Score = require("../models/Score")
const Level = require("../models/Level")
const env = require("dotenv")
const { generateFromEmail } = require("unique-username-generator")

// eslint-disable-next-line no-unused-vars
const { ObjectId } = require("mongodb")
const Leaderboard = require("../models/Leaderboard")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
env.config()

function apiError(error) {
  if (!error.message) {
    error.message = "Something went wrong"
  }
  if (!error.statusCode) {
    error.statusCode = 400
  }
  return error
}

function apiMessageFormat({ prompt, role }) {
  return {
    role,
    content: [{ type: "text", text: prompt }],
  }
}

function parsedQuestions(response) {
  return response.content[0].text
}

async function sendPromptToDb({ categoryPrompt, subcategoryPrompt, questionPrompt }) {
  const data = await Config.create({ categoryPrompt, subcategoryPrompt, questionPrompt })
  return data
}

async function createDifficultyPrompt(prompt, level) {
  const data = await Difficulty.create({ prompt, level })
  return data
}

async function scoreToStarsConverter(score) {
  const stars = await Config.find({}, { stars: 1 }).lean()
  for (const star of stars) {
    // eslint-disable-next-line no-undef
    finalStar = star.stars.filter((item) => score <= item.score)
  }
  // eslint-disable-next-line no-undef
  if (finalStar.length === 0) {
    throw new Error("Score can't be higher than 10")
  }
  // eslint-disable-next-line no-undef
  return finalStar[0].star
}

async function getSubcategoryScore(subcategoryId, userId) {
  let totalScore = 0
  const data = await Score.findOne({ subcategory: subcategoryId }).lean()
  if (data) {
    for (const level of data.levels) {
      if (level.userId.equals(userId)) {
        totalScore += level.score
      }
    }
    return totalScore
  }
  return totalScore
}

async function getLevelQuestions(levelId) {
  const questions = await Level.findOne({ _id: levelId }).lean()
  if (questions) {
    return questions.questions
  }
  throw new Error("Level not found :(")
}

async function getLevelInfo(userId, subcategoryId) {
  const bigData = { levels: [] }
  const scores = await Score.findOne({ subcategory: subcategoryId }).lean()
  let totalStars = 0
  for (const level of scores.levels) {
    if (level.userId.equals(userId)) {
      totalStars += await scoreToStarsConverter(level.score)
      bigData["levels"].push({
        level: level.level,
        id: level.levelId,
        isUnlocked: true,
        isCompleted: true,
        subCategory: subcategoryId,
        score: level.score,
        star: await scoreToStarsConverter(level.score),
      })
    }
  }
  const isUniqLevel = await isUniqueLevel(4)
  if (totalStars >= isUniqLevel.starsRequired) {
    const getIdOfUniqLevel = await Level.findOne({ subcategory: subcategoryId, level: 4 }, { _id: true, level: true })
    if (getIdOfUniqLevel) bigData["levels"].push({ level: 4, id: getIdOfUniqLevel._id, isUnlocked: true, subcategoryId })
  }
  return bigData
}

async function getLeaderBoard(currentUser) {
  const leaderboardData = []
  const leaderboard = await Leaderboard.findOne({}, { users: 1 })
  if (leaderboard) {
    for (const data of leaderboard.users) {
      if (data.user.equals(currentUser)) {
        leaderboardData.push({
          userId: data.user,
          username: data.username,
          score: data.score,
          stars: data.stars,
          currentUser: true,
        })
      } else {
        leaderboardData.push({
          userId: data.user,
          username: data.username,
          score: data.score,
          stars: data.stars,
        })
      }
    }

    return leaderboardData.sort((a, b) => b.score - a.score)
  } else {
    throw new Error("User not found :(")
  }
}
async function isLevelUnlockedForUser(userId, levelId) {
  const level = await Level.findById({ _id: levelId }, { _id: 1, subcategory: 1 })
  if (!level) {
    throw new Error("Invalid level")
  }
  const scores = await Score.findOne({ subcategory: level.subcategory })
  if (scores) {
    for (const userScore of scores.levels) {
      if ((userId == userScore.userId && levelId == userScore.levelId) || userScore.level == 1 || userScore.level == 2) {
        return true
      }
    }
  }
  return false
}

async function isUniqueLevel(level) {
  const configs = await Config.find({}).lean()
  const uniqLevel = configs[0].levels.filter((item) => item.level === level)[0]
  if (uniqLevel) {
    return uniqLevel
  } else {
    return null
  }
}

function shuffleArray(array, levelId, multiplayer) {
  const level = Level.findById({ _id: levelId }, { level: 1 })

  // Shuffle options within each question
  if (level.level != 3) {
    array.forEach((question) => {
      // Remember the correct answer index
      let correctAnswerIndex = question.answer
      // Shuffle options while maintaining the correct answer at its original index
      for (let i = question.options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[question.options[i], question.options[j]] = [question.options[j], question.options[i]]
        // Adjust the correct answer index if necessary
        if (correctAnswerIndex === i) {
          correctAnswerIndex = j
        } else if (correctAnswerIndex === j) {
          correctAnswerIndex = i
        }
      }
      // Update the correct answer index for the shuffled options
      question.answer = correctAnswerIndex
    })
  }

  // Shuffle the questions
  if (!multiplayer) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }
  return array
}

async function createQuestions(subcategoryId, level, questions) {
  const subcategory = await Subcategory.findOne({ _id: subcategoryId })
  if (!subcategory) {
    throw new Error("Invalid subcategory")
  }
  const updatedLevelDocument = await Level.findOneAndUpdate(
    { subcategory: subcategoryId, level: level },
    { subcategory: subcategoryId, questions: questions, level: level },
    { new: true, upsert: true }
  )
  return updatedLevelDocument
}
async function createFacts(subcategoryId, facts) {
  const subcategory = await Subcategory.findOne({ _id: subcategoryId })
  if (!subcategory) {
    throw new Error("Invalid subcategory")
  }
  const updatedFactsDocument = await Subcategory.findOneAndUpdate(
    {
      _id: subcategoryId,
    },
    { _id: subcategoryId, facts },
    {
      new: true,
    }
  )
  return updatedFactsDocument
}

function decodeToken(req, res, next) {
  const token = req.headers.authorization
  if (!token) {
    return res.status(500).send({ error: "You're not authenticated :(" })
  }
  try {
    const data = jwt.verify(token, process.env.SECRET_KEY)
    req.body.internaluserId = data.userId
    next()
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return res.status(500).send({ error: "Invalid token :(" })
  }
}

async function createUser(email, name) {
  const user = await User.findOne({ email })
  if (user) {
    return { _id: user.id, username: user.username }
  } else {
    const newUser = await User.create({ email, username: generateFromEmail(name || email, 0).slice(0, 6) })
    return { _id: newUser._id, username: newUser.username }
  }
}

async function getUserProfile(userId) {
  if (!userId) {
    throw new Error("Invalid input")
  }
  const userInfo = await User.findOne({ _id: userId }).lean()
  const userProfile = []
  let totalScore = 0
  let totalStars = 0
  const scores = await Score.find({}).lean()
  for (const score of scores) {
    for (const level of score.levels) {
      if (level.userId.equals(userId)) {
        totalScore += level.score
        totalStars += await scoreToStarsConverter(level.score)
      }
    }
  }
  const { rank } = await getLeaderBoardRank(userId)
  userProfile.push({ userId: userId, email: userInfo.email, username: userInfo.username, score: totalScore, stars: totalStars, rank })
  return userProfile[0]
}

async function getLeaderBoardRank(userId) {
  const sortedLeaderboard = (await Leaderboard.findOne({}, { users: 1, _id: 0 })).users.sort((a, b) => b.score - a.score)
  for (let index = 0; index <= sortedLeaderboard.length - 1; index++) {
    if (sortedLeaderboard[index].user.equals(userId)) {
      return { username: sortedLeaderboard[index].username, rank: index + 1 }
    }
  }
}

async function addScoreToLeaderboard(userId, score) {
  const user = await User.findOne({ _id: userId }, { username: 1, _id: 0 })
  const leaderboard = await Leaderboard.findOne()
  if (leaderboard) {
    const userIndex = leaderboard.users.findIndex((user) => user.user.equals(userId))

    if (userIndex !== -1) {
      // User exists in the leaderboard, update the score and stars
      leaderboard.users[userIndex].username = user.username
      leaderboard.users[userIndex].score += score
      leaderboard.users[userIndex].stars += await scoreToStarsConverter(score)
    }
    await leaderboard.save()
  }
}

async function addUserToLeaderboard(userId, score) {
  const user = await User.findOne({ _id: userId }, { username: 1, _id: 0 })
  const leaderboard = await Leaderboard.findOne()
  if (leaderboard) {
    leaderboard.users.push({
      user: userId,
      username: user.username,
      score: score,
      stars: await scoreToStarsConverter(score),
    })
    await leaderboard.save()
  }
}
async function leaderboardClimbing(userId, oldLeaderBoard) {
  const leaderboardDetail = []
  const oldRankIndex = oldLeaderBoard.findIndex((user) => user.user.equals(userId))
  const sortedLeaderboard = (await Leaderboard.findOne({}, { users: 1, _id: 0 })).users.sort((a, b) => b.score - a.score)

  for (let newRankIndex = 0; newRankIndex <= sortedLeaderboard.length - 1; newRankIndex++) {
    if (sortedLeaderboard[newRankIndex].user.equals(userId) && newRankIndex < 10) {
      if (oldRankIndex != newRankIndex && newRankIndex == 0) {
        leaderboardDetail.push(
          { userId: userId, username: sortedLeaderboard[newRankIndex].username, score: sortedLeaderboard[newRankIndex].score, star: sortedLeaderboard[newRankIndex].stars, currentUser: true },
          {
            userId: sortedLeaderboard[newRankIndex + 1].user,
            username: sortedLeaderboard[newRankIndex + 1].username,
            score: sortedLeaderboard[newRankIndex + 1].score,
            star: sortedLeaderboard[newRankIndex + 1].stars,
          },
          {
            userId: sortedLeaderboard[newRankIndex + 2].user,
            username: sortedLeaderboard[newRankIndex + 2].username,
            score: sortedLeaderboard[newRankIndex + 2].score,
            star: sortedLeaderboard[newRankIndex + 2].stars,
          }
        )
      } else if (oldRankIndex != newRankIndex && newRankIndex == 8) {
        leaderboardDetail.push(
          {
            userId: sortedLeaderboard[newRankIndex - 2].user,
            username: sortedLeaderboard[newRankIndex - 2].username,
            score: sortedLeaderboard[newRankIndex - 2].score,
            star: sortedLeaderboard[newRankIndex - 2].stars,
          },
          {
            userId: sortedLeaderboard[newRankIndex - 1].user,
            username: sortedLeaderboard[newRankIndex - 1].username,
            score: sortedLeaderboard[newRankIndex - 1].score,
            star: sortedLeaderboard[newRankIndex - 1].stars,
          },
          { userId: userId, username: sortedLeaderboard[newRankIndex].username, score: sortedLeaderboard[newRankIndex].score, star: sortedLeaderboard[newRankIndex].stars, currentUser: true }
        )
      } else if (oldRankIndex != newRankIndex) {
        leaderboardDetail.push(
          {
            userId: sortedLeaderboard[newRankIndex - 1].user,
            username: sortedLeaderboard[newRankIndex - 1].username,
            score: sortedLeaderboard[newRankIndex - 1].score,
            star: sortedLeaderboard[newRankIndex - 1].stars,
          },
          { userId: userId, username: sortedLeaderboard[newRankIndex].username, score: sortedLeaderboard[newRankIndex].score, star: sortedLeaderboard[newRankIndex].stars, currentUser: true },
          {
            userId: sortedLeaderboard[newRankIndex + 1].user,
            username: sortedLeaderboard[newRankIndex + 1].username,
            score: sortedLeaderboard[newRankIndex + 1].score,
            star: sortedLeaderboard[newRankIndex + 1].stars,
          }
        )
      }
    }
  }
  return leaderboardDetail
}

module.exports = {
  apiMessageFormat,
  parsedQuestions,
  sendPromptToDb,
  apiError,
  createDifficultyPrompt,
  scoreToStarsConverter,
  getSubcategoryScore,
  getLevelQuestions,
  getLevelInfo,
  getLeaderBoard,
  isUniqueLevel,
  isLevelUnlockedForUser,
  shuffleArray,
  createQuestions,
  createFacts,
  decodeToken,
  createUser,
  getUserProfile,
  getLeaderBoardRank,
  addScoreToLeaderboard,
  addUserToLeaderboard,
  leaderboardClimbing,
}

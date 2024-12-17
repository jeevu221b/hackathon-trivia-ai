// eslint-disable-next-line no-unused-vars
const mongodb = require("mongodb")
const Config = require("../models/Config")
const Subcategory = require("../models/Subcategory")
const Difficulty = require("../models/Difficulty")
const Score = require("../models/Score")
const Level = require("../models/Level")
// eslint-disable-next-line no-unused-vars
const { ObjectId } = require("mongodb")
const Leaderboard = require("../models/Leaderboard")
const jwt = require("jsonwebtoken")

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

async function getUserTotalScore(userId) {
  if (!userId) {
    throw new Error("Invalid input")
  }
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

  const leaderboard = await Leaderboard.findOneAndUpdate(
    {
      users: {
        $elemMatch: {
          user: userId,
        },
      },
    },
    {
      $set: {
        "users.$.score": totalScore,
        "users.$.stars": totalStars,
      },
    },
    {
      new: true,
    }
  )

  if (!leaderboard) {
    console.log("No leaderboard entry found for the given userId")
    await Leaderboard.create({ users: [{ user: userId, score: totalScore, stars: totalStars }] })
  }
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
  for (const level of scores.levels) {
    if (level.userId.equals(userId)) {
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
  return bigData
}

async function getLeaderBoard() {
  const leaderboardData = []
  const leaderboard = await Leaderboard.findOne({}, { users: 1 })
  if (leaderboard) {
    for (const data of leaderboard.users) {
      leaderboardData.push({
        userId: data.user,
        username: data.username,
        score: data.score,
        stars: data.stars,
      })
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
      console.log(userScore, "userScore")
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

function shuffleArray(array, levelId) {
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
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
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
    res.status(500).send({ error: "You're not authenticated :(" })
  }
  try {
    const data = jwt.verify(token, process.env.SECRET_KEY)
    req.body.email = data
    next()
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).send({ error: "Invalid token :(" })
  }
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
  getUserTotalScore,
  getLevelInfo,
  getLeaderBoard,
  isUniqueLevel,
  isLevelUnlockedForUser,
  shuffleArray,
  createQuestions,
  createFacts,
  decodeToken,
}

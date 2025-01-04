const mongoose = require("mongoose")
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
const WeeklyLeaderboard = require("../models/WeeklyLeaderboard")
const WeeklyLeaderboardWinners = require("../models/WeeklyLeaderboardWinners")

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

async function scoreToStarsConverter(score, config) {
  let stars
  if (!config) {
    stars = await Config.find({}, { stars: 1 }).lean()
  } else {
    stars = config
  }

  for (const star of stars) {
    // eslint-disable-next-line no-undef
    finalStar = star?.stars?.filter((item) => score <= item.score)
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
    if (getIdOfUniqLevel) bigData["levels"].push({ level: 4, id: getIdOfUniqLevel._id, isUnlocked: true, isCompleted: false, subCategory: subcategoryId, score: 0, star: 0 })
  }
  return bigData
}

async function addUserToWeeklyLeaderBoardWinners(weeklyLeaderboard) {
  weeklyLeaderboard.users.sort((a, b) => b.score - a.score)
  let user = weeklyLeaderboard.users[0]
  if (!user) return
  user = { user: user.user, username: user.username, score: user.score, stars: user.stars, climbedAt: weeklyLeaderboard.climbedAt }
  const leaderboard = await WeeklyLeaderboardWinners.findOne()
  if (leaderboard) {
    leaderboard.winners.push(user)
    await leaderboard.save()
  } else {
    await WeeklyLeaderboardWinners.create({ winners: [user] })
  }
}

async function getLeaderBoard(currentUser) {
  const leaderboardData = []
  const weeklyLeaderboardData = []
  const leaderboard = await Leaderboard.findOne({}, { users: 1 })
  const weeklyLeaderboard = await WeeklyLeaderboard.findOne({}, { users: 1, climbedAt: 1, endsAt: 1 }).lean()
  if (!weeklyLeaderboard) {
    await resetWeeklyLeaderBoard()
  }

  if (Date.now() > weeklyLeaderboard?.endsAt) {
    console.log("/getLeaderboard: End of the week, resetting the weekly leaderboard ")
    await addUserToWeeklyLeaderBoardWinners(weeklyLeaderboard)
    await resetWeeklyLeaderBoard()
  }

  const users = await User.find({})
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
  }

  if (weeklyLeaderboard) {
    for (const data of weeklyLeaderboard.users) {
      if (data.user.equals(currentUser)) {
        weeklyLeaderboardData.push({
          userId: data.user,
          username: data.username,
          score: data.score,
          stars: data.stars,
          currentUser: true,
        })
      } else {
        weeklyLeaderboardData.push({
          userId: data.user,
          username: data.username,
          score: data.score,
          stars: data.stars,
        })
      }
    }
  }

  // Those user who has not played the game yet, set their scores to 0 and return them
  for (const user of users) {
    if (!leaderboard.users.some((data) => data.user.equals(user._id))) {
      leaderboardData.push({
        userId: user._id,
        username: user.username,
        score: 0,
        stars: 0,
        ...(user._id.equals(currentUser) ? { currentUser: true } : {}),
      })
    }
  }
  const sortedLeaderboard = leaderboardData.sort((a, b) => b.score - a.score)
  const sortedWeeklyLeaderboard = weeklyLeaderboardData.sort((a, b) => b.score - a.score)
  if (weeklyLeaderboard?.climbedAt) sortedWeeklyLeaderboard[0].climbedAt = weeklyLeaderboard.climbedAt
  return { all: sortedLeaderboard, weekly: sortedWeeklyLeaderboard }
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
    if (error.name === "TokenExpiredError") {
      req.body.hasExpired = true
      next()
      return
      // Handle expired token
    }
    return res.status(500).send({ error: "Invalid token :(" })
  }
}

async function createUser(email, name) {
  try {
    const user = await User.findOne({ email })
    if (user) {
      await User.updateOne({ email }, { firstLogin: false })
      return { _id: user.id, username: user.username }
    } else {
      const newUser = await User.create({
        email,
        username: generateFromEmail(name || email, 0)
          .slice(0, 6)
          .toLowerCase(),
      })
      return { _id: newUser._id, username: newUser.username }
    }
  } catch (error) {
    console.error(error)
    throw new Error("Invalid input")
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
  userProfile.push({ userId: userId, email: userInfo.email, username: userInfo.username, score: totalScore, stars: totalStars, rank, xp: userInfo.xp, gems: userInfo.gems })
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
async function updateLeaderboard(userId, score, stars) {
  const user = await User.findOne({ _id: userId }, { username: 1, _id: 0 })
  const leaderboard = await Leaderboard.findOne()

  if (leaderboard) {
    const userIndex = leaderboard.users.findIndex((u) => u.user.equals(userId))

    if (userIndex !== -1) {
      // User exists in the leaderboard, update the score and stars
      leaderboard.users[userIndex].username = user.username
      leaderboard.users[userIndex].score += score
      leaderboard.users[userIndex].stars += stars
    } else {
      // User doesn't exist in the leaderboard, add them
      leaderboard.users.push({
        user: userId,
        username: user.username,
        score: score,
        stars: stars,
      })
    }

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

function sortCategory(categories, recentlyPlayedCategory) {
  const currentTime = Date.now()
  const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000
  const cutoffTime = currentTime - fifteenDaysInMs

  // Separate categories and shuffle in one pass
  const recentCategories = []
  const otherCategories = []

  for (let i = categories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[categories[i], categories[j]] = [categories[j], categories[i]]

    const category = categories[i]
    if (new Date(category.createdAt).getTime() > cutoffTime) {
      recentCategories.push(category)
    } else {
      otherCategories.push(category)
    }
  }

  // Handle the last element
  const lastCategory = categories[0]
  if (new Date(lastCategory.createdAt).getTime() > cutoffTime) {
    recentCategories.push(lastCategory)
  } else {
    otherCategories.push(lastCategory)
  }

  // Combine the recentCategories (already shuffled) and otherCategories (already shuffled)
  if (recentlyPlayedCategory) {
    return moveRecentlyPlayedCategoryToTop(recentCategories.concat(otherCategories), recentlyPlayedCategory)
  }
  return recentCategories.concat(otherCategories)
}

function getNearestFridayStartDate() {
  // Get current date
  let currentDate = new Date()

  // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  let currentDay = currentDate.getDay()

  // Calculate days until next Friday (Friday is 5th day of the week)
  let daysUntilFriday = 5 - currentDay

  // If today is Friday (currentDay === 5), daysUntilFriday would be 0, so we need to adjust for next Friday
  if (daysUntilFriday <= 0) {
    daysUntilFriday += 7
  }

  // Calculate the date of next Friday
  let nextFridayDate = new Date(currentDate)
  nextFridayDate.setDate(currentDate.getDate() + daysUntilFriday)

  // Set the time to 00:00:00 (start of the day)
  nextFridayDate.setHours(0, 0, 0, 0)

  return nextFridayDate
}

async function resetWeeklyLeaderBoard() {
  try {
    // Check if a leaderboard already exists
    let leaderboard = await WeeklyLeaderboard.findOne()

    if (leaderboard) {
      // If leaderboard exists, update endsAt and users fields
      leaderboard.endsAt = getNearestFridayStartDate()
      leaderboard.users = []
      leaderboard.climbedAt = null
    } else {
      // If leaderboard doesn't exist, create a new one
      const endsAt = getNearestFridayStartDate()
      leaderboard = new WeeklyLeaderboard({ endsAt, users: [], climbedAt: null })
    }

    // Save the leaderboard (either newly created or updated)
    await leaderboard.save()
  } catch (error) {
    console.error("Error resetting leaderboard:", error)
  }
}

async function getRandomQuestions(categoryId) {
  try {
    // Aggregate pipeline to find Levels matching the categoryId and sample 10 random questions
    const randomQuestions = await Level.aggregate([
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "subcategory.category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $match: {
          "category._id": mongoose.Types.ObjectId(categoryId),
        },
      },
      { $unwind: "$questions" }, // Unwind the questions array
      { $sample: { size: 20 } }, // Sample 10 random questions
      { $replaceRoot: { newRoot: "$questions" } }, // Replace root with questions
    ])

    return randomQuestions
  } catch (err) {
    console.error("Error fetching random questions:", err)
    throw err
  }
}

async function updateScore(subcategory, userId, levelId, updatedSession, gems) {
  let isBestScore = false
  let score = -1
  let stars = 0
  let exp = 5
  const existingScore = await Score.findOne(
    {
      subcategory: subcategory,
      levels: {
        $elemMatch: {
          userId: userId,
          levelId: levelId,
        },
      },
    },
    {
      "levels.$": 1,
    }
  ).lean()
  if (existingScore) {
    if (updatedSession.score > existingScore.levels[0].score) {
      score = updatedSession.score - existingScore.levels[0].score
      stars = (await scoreToStarsConverter(updatedSession.score)) - (await scoreToStarsConverter(existingScore.levels[0].score))
      isBestScore = true
      await Score.findOneAndUpdate(
        {
          subcategory: subcategory,
        },
        {
          $set: {
            "levels.$[elem].score": updatedSession.score,
            "levels.$[elem].isCompleted": updatedSession.isCompleted,
          },
        },
        {
          new: true,
          arrayFilters: [
            {
              "elem.userId": updatedSession.userId,
              "elem.levelId": updatedSession.levelId,
            },
          ],
        }
      )
    }
    // await addScoreToLeaderboard(updatedSession.userId, score - existingScore.levels[0].score)
  } else {
    // Insert new document
    score = updatedSession.score
    stars = await scoreToStarsConverter(score)
    exp += exp * stars
    await Score.updateOne(
      {
        subcategory: subcategory,
      },
      {
        $addToSet: {
          levels: {
            userId: updatedSession.userId,
            levelId: updatedSession.levelId,
            level: updatedSession.level,
            score: updatedSession.score,
            isCompleted: updatedSession.isCompleted,
          },
        },
      },
      {
        upsert: true,
      }
    )
  }
  const xpAndGem = await updateXp(userId, exp, gems)
  return { isBestScore, score, stars, xpAndGem }
}

async function updateXp(userId, xp, gems) {
  const user = await User.findOne({ _id: userId })
  if (user) {
    const beforeXp = findClosestSmallerScore(user.xp, gems)
    user.xp += xp
    const afterXp = findClosestSmallerScore(user.xp, gems)
    if (beforeXp != afterXp) {
      user.gems += 1
    }
    await user.save()
    // Return only the desired fields
    return {
      xp: user.xp,
      gems: user.gems,
    }
  }
  return null // Return null if the user is not found
}

async function redeemGem(userId) {
  const user = await User.findOne({ _id: userId })
  if (user) {
    user.gems -= 1
    await user.save()
    return {
      gems: user.gems,
    }
  }
  return null
}

function findClosestSmallerScore(target, data) {
  let closestScore = null
  data.map((item) => {
    if (item.score <= target) {
      return (closestScore = item.score)
    }
  })
  return closestScore
}

async function addXp({ userId, score, isFirstTime, winner }) {
  const config = await Config.find({}, { stars: 1, baseXp: 1, gems: 1, multiplayerMultiplier: 1 }).lean()
  let exp = config[0].baseXp
  if (isFirstTime && score) {
    const stars = await scoreToStarsConverter(score, config)
    exp += exp * stars
  }
  if (winner && typeof winner === "boolean") {
    exp += exp * config[0].multiplayerMultiplier
  }
  const updatedXp = updateXp(userId, exp, config[0].gems)
  return updatedXp
}

async function addMultiplayerXp(scores) {
  const usersScore = []
  for (const score of scores) {
    usersScore.push(await addXp({ userId: score.userId, winner: score.winner }))
  }
  return usersScore
}

async function addRecentlyPlayedCategory(userId, categoryId) {
  const user = await User.findOne({ _id: userId })
  if (user) {
    // Initialize recentlyPlayed if it doesn't exist or is empty
    if (!user.recentlyPlayed || user.recentlyPlayed.length === 0) {
      user.recentlyPlayed = [{ categories: [] }]
    }

    // Initialize categories if it doesn't exist
    if (!user.recentlyPlayed[0].categories) {
      user.recentlyPlayed[0].categories = []
    }

    if (user.recentlyPlayed[0].categories.length <= 5) {
      user.recentlyPlayed[0].categories.push(categoryId)
    } else {
      // Remove the first element of the categories array
      user.recentlyPlayed[0].categories.shift()
      // Push a new category
      user.recentlyPlayed[0].categories.push(categoryId)
    }

    // Save the updated user document
    await user.save()
    return user
  }
  return null
}

async function getRecentlyPlayedCategory(userId) {
  const user = await User.findOne({ _id: userId })
  if (user) {
    const currentTime = Date.now()
    const eightHoursInMs = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    const cutoffTime = currentTime - eightHoursInMs
    if (new Date(user.recentlyPlayed[0].updatedAt).getTime() > cutoffTime) {
      return user.recentlyPlayed[0].categories[user.recentlyPlayed[0].categories.length - 1]
    }
  }
  return null
}

function moveRecentlyPlayedCategoryToTop(categories, userId) {
  const index = categories.findIndex((category) => category._id.equals(userId))
  if (index === -1) {
    console.log("Category not found")
    return categories
  }
  const recentlyPlayedCategory = categories[index]
  categories.splice(index, 1)
  categories.unshift(recentlyPlayedCategory)
  return categories
}

async function getCategoryId(subcategoryId) {
  const subcategory = await Subcategory.findOne({ _id: subcategoryId })
  if (subcategory) {
    return subcategory.category
  }
  return null
}

module.exports = {
  getCategoryId,
  addRecentlyPlayedCategory,
  getRecentlyPlayedCategory,
  addMultiplayerXp,
  addXp,
  findClosestSmallerScore,
  redeemGem,
  updateXp,
  addUserToWeeklyLeaderBoardWinners,
  resetWeeklyLeaderBoard,
  getRandomQuestions,
  getNearestFridayStartDate,
  sortCategory,
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
  updateLeaderboard,
  updateScore,
}

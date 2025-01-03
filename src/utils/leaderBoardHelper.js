const User = require("../models/User")
const WeeklyLeaderboard = require("../models/WeeklyLeaderboard")
const { scoreToStarsConverter } = require("./helper")

async function addScoreToWeeklyLeaderboard(userId, score) {
  const user = await User.findOne({ _id: userId }, { username: 1, _id: 0 }).lean()
  const weeklyLeaderboard = await WeeklyLeaderboard.findOne()
  if (weeklyLeaderboard) {
    const userIndex = weeklyLeaderboard.users.findIndex((user) => user.user.equals(userId))

    if (userIndex !== -1) {
      // User exists in the leaderboard, update the score and stars
      weeklyLeaderboard.users[userIndex].username = user.username
      weeklyLeaderboard.users[userIndex].score += score
      weeklyLeaderboard.users[userIndex].stars += await scoreToStarsConverter(score)
      await weeklyLeaderboard.save()
    }
  }
}

async function addUserToWeeklyLeaderboard(userId, score) {
  const user = await User.findOne({ _id: userId }, { username: 1, _id: 0 })
  const weeklyLeaderboard = await WeeklyLeaderboard.findOne()
  if (weeklyLeaderboard) {
    const stars = await scoreToStarsConverter(score)
    weeklyLeaderboard.users.push({
      user: userId,
      username: user.username,
      score: score,
      stars: stars,
    })
    await weeklyLeaderboard.save()
  }
}

async function weeklyLeaderboardClimbing(userId, oldLeaderBoard) {
  const oldRankIndex = oldLeaderBoard?.findIndex((user) => user.user.equals(userId))
  const sortedLeaderboard = (await WeeklyLeaderboard.findOne({}, { users: 1, _id: 0 })).users.sort((a, b) => b.score - a.score)

  for (let newRankIndex = 0; newRankIndex <= sortedLeaderboard.length - 1; newRankIndex++) {
    if (sortedLeaderboard[newRankIndex].user.equals(userId) && newRankIndex < 10) {
      if (oldRankIndex != newRankIndex && newRankIndex == 0) {
        // User is at the top of the leaderboard so update the climbed at field in the leaderboard
        await WeeklyLeaderboard.findOneAndUpdate({}, { climbedAt: new Date() }, { upsert: true })
      }
    }
  }
}

async function updateWeeklyLeaderboard(userId, score, stars) {
  const user = await User.findOne({ _id: userId }, { username: 1, _id: 0 }).lean()
  const weeklyLeaderboard = await WeeklyLeaderboard.findOne()

  if (weeklyLeaderboard) {
    const userIndex = weeklyLeaderboard.users.findIndex((u) => u.user.equals(userId))

    if (userIndex !== -1) {
      // User exists in the leaderboard, update the score and stars
      weeklyLeaderboard.users[userIndex].username = user.username
      weeklyLeaderboard.users[userIndex].score += score
      weeklyLeaderboard.users[userIndex].stars += stars
    } else {
      // User doesn't exist in the leaderboard, add them
      weeklyLeaderboard.users.push({
        user: userId,
        username: user.username,
        score: score,
        stars: stars,
      })
    }

    await weeklyLeaderboard.save()
  }
}

module.exports = { addScoreToWeeklyLeaderboard, addUserToWeeklyLeaderboard, weeklyLeaderboardClimbing, updateWeeklyLeaderboard }

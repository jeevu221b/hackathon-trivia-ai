const express = require("express")
const { redeemGem, addXp, addMultiplayerXp, updateWatchList, getWatchList } = require("../utils/helper")
const mongodb = require("mongodb")
const Config = require("../models/Config")
const router = express.Router()

router.post("/redeem/gem", async (req, res) => {
  try {
    const { internaluserId } = req.body
    if (!internaluserId) {
      throw new Error("Invalid input")
    }
    const response = await redeemGem(internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/update/xp", async (req, res) => {
  try {
    const { internaluserId, score, isFirstTime } = req.body
    if (!internaluserId) {
      throw new Error("User not logged in :(")
    }
    const response = await addXp({ userId: internaluserId, score: score, isFirstTime: isFirstTime })
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/update/multiplayer/xp", async (req, res) => {
  try {
    const { internaluserId, scores } = req.body
    if (!internaluserId || !scores) {
      throw new Error("Invalid input")
    }
    validateMultiplayerData(scores)
    const response = await addMultiplayerXp(scores)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/ranks", async (req, res) => {
  try {
    const { internaluserId } = req.body
    if (!internaluserId) {
      throw new Error("Invalid input")
    }
    let response = await Config.findOne({}, { titles: 1 }).lean()
    response = response.titles.map((title) => {
      return {
        title: title.title,
        xp: title.score,
      }
    })
    return res.status(200).send(response.reverse())
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/update/watchlist", async (req, res) => {
  try {
    const { id, hasWatched, internaluserId, type } = req.body
    if (!id || hasWatched == undefined || !type) {
      throw new Error("Invalid input")
    }
    const response = await updateWatchList(id, type, hasWatched, internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/watchlist", async (req, res) => {
  try {
    const { internaluserId } = req.body
    const response = await getWatchList(internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

function validateMultiplayerData(scores) {
  if (scores.length === 0) {
    throw new Error('Invalid data: The "scores" array must not be empty.')
  }
  scores.forEach((item) => {
    if (typeof item !== "object" || item === null || !("userId" in item)) {
      throw new Error('Invalid data: Each item in the "scores" array must be an object with a "userId" property.')
    }
    if (!mongodb.ObjectId.isValid(item.userId)) {
      throw new Error('Invalid data: The "userId" property must be valid MongoDB Id.')
    }
  })
  return true
}

module.exports = router

const express = require("express")
const mongodb = require("mongodb")
const { loadInitialData } = require("../jobs/loadInitialData")
const { getLeaderBoard, getSubcategoryScore, getUserProfile } = require("../utils/helper")
const User = require("../models/User")
const router = express.Router()

router.post("/data", async (req, res) => {
  try {
    const { internaluserId, hasExpired, multiplayer } = req.body
    if (!internaluserId && !hasExpired) {
      throw new Error("Invalid input")
    }
    if (hasExpired) {
      return res.status(410).json({ hasExpired })
    }

    const { firstLogin } = await User.findByIdAndUpdate(internaluserId, { firstLogin: false }, { firstLogin: 1 }).lean()
    const response = await loadInitialData(internaluserId, multiplayer, firstLogin)
    return res.status(200).json(response)
  } catch (error) {
    console.error("Error in /data endpoint:", error)
    return res.status(error.statusCode || 400).json({ error: error.message })
  }
})

router.get("/get/totalscore", async (req, res) => {
  try {
    const body = req.body
    if (!body.subcategoryId || !body.internaluserId) {
      throw new Error("Invalid input")
    }
    if (!mongodb.ObjectId.isValid(body.subcategoryId) || !mongodb.ObjectId.isValid(body.internaluserId)) {
      throw new Error("Invalid id")
    }
    const response = await getSubcategoryScore(body.subcategoryId, body.internaluserId)
    return res.status(200).send({ score: response })
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/leaderboard", async (req, res) => {
  try {
    const response = await getLeaderBoard(req.body.internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    console.log(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/profile", async (req, res) => {
  try {
    const response = await getUserProfile(req.body.internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    return res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

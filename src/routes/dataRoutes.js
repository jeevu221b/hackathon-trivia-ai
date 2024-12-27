const express = require("express")
const mongodb = require("mongodb")
const { loadInitialData } = require("../jobs/loadInitialData")
const { getLeaderBoard, getSubcategoryScore, getUserProfile } = require("../utils/helper")
const router = express.Router()

router.post("/data", async (req, res) => {
  try {
    const body = req.body
    console.log(body.internaluserId)
    if (!body.internaluserId) {
      throw new Error("Invalid input")
    }
    const response = await loadInitialData(body.internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
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

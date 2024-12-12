const express = require("express")
const mongodb = require("mongodb")
const { loadInitialData } = require("../jobs/loadInitialData")
const { getTotalScore, getLeaderBoard, decodeToken } = require("../utils/helper")
const router = express.Router()

router.post("/data", async (req, res) => {
  try {
    const body = req.body
    if (!body.userId) {
      throw new Error("Invalid input")
    }
    const response = await loadInitialData(body.userId)
    res.status(200).send(response)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/totalscore", async (req, res) => {
  try {
    const body = req.body
    if (!body.subcategoryId || !body.userId) {
      throw new Error("Invalid input")
    }
    if (!mongodb.ObjectId.isValid(body.subcategoryId) || !mongodb.ObjectId.isValid(body.userId)) {
      throw new Error("Invalid id")
    }
    const response = await getTotalScore(body.subcategoryId, body.userId)
    res.status(200).send(response)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/leaderboard", decodeToken, async (req, res) => {
  try {
    const response = await getLeaderBoard()
    res.status(200).send(response)
  } catch (error) {
    console.log(error)
    res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

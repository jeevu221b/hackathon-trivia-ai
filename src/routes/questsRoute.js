const express = require("express")
const { createQuest, getQuests } = require("../jobs/quests")
const User = require("../models/User")
const router = express.Router()

router.post("/create/quest", async (req, res) => {
  try {
    const body = req.body
    if (!body.title || !body.taskType) {
      throw new Error("Title and task type are required.")
    }
    const response = await createQuest(body.title, body.taskType)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/quests", async (req, res) => {
  try {
    const userId = req.body.internaluserId
    const response = await getQuests(userId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

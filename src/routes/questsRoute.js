const express = require("express")
const { createQuest } = require("../jobs/quests")
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

module.exports = router

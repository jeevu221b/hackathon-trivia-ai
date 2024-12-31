const express = require("express")
const mongodb = require("mongodb")
const { getLevelQuestions, createQuestions, shuffleArray, createFacts } = require("../utils/helper")

const router = express.Router()

router.post("/create/question", async (req, res) => {
  try {
    const body = req.body
    if (!body.subcategoryId && !body.level && !body.questions) {
      throw new Error("Invalid input")
    }
    if (!mongodb.ObjectId.isValid(body.subcategoryId) || typeof body.level !== "number" || !Array.isArray(body.questions)) {
      throw new Error("Invalid paramas")
    }
    const response = await createQuestions(body.subcategoryId, body.level, body.questions)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/get/question", async (req, res) => {
  try {
    const body = req.body
    if (!mongodb.ObjectId.isValid(body.levelId)) {
      throw new Error("Invalid id")
    }
    const response = await getLevelQuestions(body.levelId)
    return res.status(200).send(shuffleArray(response, body.levelId, body.multiplayer))
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/create/facts", async (req, res) => {
  try {
    const body = req.body
    if (!mongodb.ObjectId.isValid(body.subcategoryId) || !Array.isArray(body.facts)) {
      throw new Error("Invalid input")
    }
    const response = await createFacts(body.subcategoryId, body.facts)
    return res.status(200).send(response)
  } catch (error) {
    console.log(error)
    return res.status(error.status || 400).send(error.message)
  }
})

module.exports = router

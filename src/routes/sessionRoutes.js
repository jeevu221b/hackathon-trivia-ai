const mongodb = require("mongodb")
const express = require("express")
const { createSession, updateSession, expireSession } = require("../jobs/createSession")

const router = express.Router()

router.post("/create/session", async (req, res) => {
  try {
    const body = req.body
    if (!body.internaluserId) {
      throw new Error("Invalid input")
    }
    if (!mongodb.ObjectId.isValid(body.internaluserId)) {
      throw new Error("Invalid id")
    }
    const response = await createSession(body.internaluserId, body.levelId, body.multiplayer)
    return res.status(200).send({ sessionId: response })
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/update/session", async (req, res) => {
  try {
    const body = req.body
    body.score = Number(body.score)
    if (!body.sessionId && !body.score && !body.isCompleted) {
      throw new Error("Invalid input")
    }
    if (!mongodb.ObjectId.isValid(body.sessionId)) {
      throw new Error("Invalid id")
    } else if (typeof body.score !== "number" || body.score > 10) {
      throw new Error("Invalid score")
    } else if (typeof body.isCompleted !== "boolean") {
      throw new Error("'isCompleted' should be a boolean value")
    }
    const response = await updateSession(body.sessionId, body.score, body.isCompleted)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/expire/session", async (req, res) => {
  try {
    const body = req.body
    if (!body.sessionId) {
      throw new Error("Invalid input")
    }
    if (!mongodb.ObjectId.isValid(body.sessionId)) {
      throw new Error("Invalid id")
    }
    const response = await expireSession(body.sessionId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

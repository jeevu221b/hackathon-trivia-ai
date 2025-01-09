const express = require("express")
const router = express.Router()
const env = require("dotenv")
const jwt = require("jsonwebtoken")
const { createUser } = require("../utils/helper")
env.config()

router.post("/login", async (req, res) => {
  try {
    const { email, name } = req.body
    const userData = { email }
    if (!email) {
      return res.status(400).send({ error: "Invalid input :(" })
    }
    const data = await createUser(email, name)
    userData.userId = data._id
    const token = jwt.sign(userData, process.env.SECRET_KEY, { expiresIn: "15d" })
    return res.status(200).send({ token, id: userData.userId, username: data.username })
  } catch (error) {
    return res.status(500).send({ error: error.message })
  }
})
router.post("/demo", (req, res) => {
  res.send(200).send("Demo :)")
})

module.exports = router

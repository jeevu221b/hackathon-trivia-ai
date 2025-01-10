const express = require("express")
const router = express.Router()
const env = require("dotenv")
const jwt = require("jsonwebtoken")
const { createUser, verifyUser } = require("../utils/helper")
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

router.post("/developer-login", async (req, res) => {
  try {
    let { email, password } = req.body
    password = password.trim()
    if (!email && !password) {
      return res.status(400).send({ error: "Invalid input :(, please enter both email and password!" })
    }
    password = jwt.verify(password, process.env.SECRET_KEY)
    const user = await verifyUser(email, password.password)
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: "15d" })
    return res.status(200).send({ token })
  } catch (error) {
    console.log(error.name, error.message)
    if (error.name === "JsonWebTokenError") return res.status(400).send({ error: error.name, message: error.message })
    return res.status(500).send({ error: error.name, message: error.message })
  }
})

router.post("/demo", (req, res) => {
  res.send(200).send("Demo :)")
})

module.exports = router

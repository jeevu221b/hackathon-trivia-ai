const express = require("express")
const cors = require("cors")
const env = require("dotenv")
const jwt = require("jsonwebtoken")
const helmet = require("helmet")
const categoryRoutes = require("./routes/categoryRoutes")
const subcategoryRoutes = require("./routes/subcategoryRoutes")
const questionRoutes = require("./routes/questionRoutes")
const sessionRoutes = require("./routes/sessionRoutes")
const dataRoutes = require("./routes/dataRoutes")

env.config()

const app = express()
// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(helmet())

// Middleware function to log incoming requests
function logRequests(req, res, next) {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`)
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    console.log("Request body:", req.body)
  }
  next() // Call next middleware in chain
}

app.use(logRequests)

// Use the route files as middleware
app.use("/api", categoryRoutes)
app.use("/api", subcategoryRoutes)
app.use("/api", questionRoutes)
app.use("/api", sessionRoutes)
app.use("/api", dataRoutes)
app.post("/login", (req, res) => {
  const { email } = req.body
  const userData = { email }
  if (!email) {
    res.status(400).send({ error: "Invalid input :(" })
  }
  const token = jwt.sign(userData, process.env.SECRET_KEY, { expiresIn: "15d" })
  return res.status(200).send({ token })
})

module.exports = app

const express = require("express")
const cors = require("cors")
const env = require("dotenv")
const helmet = require("helmet")
const { decodeToken } = require("./utils/helper")
const baseRoute = require("./routes/baseRoute")

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
  console.log("Request headers:", req.headers)
  next() // Call next middleware in chain
}

app.use(logRequests)

const nonAuthRoutes = ["/api/login", "/api/developer-login"]

app.use(async (req, res, next) => {
  if (nonAuthRoutes.includes(req.url)) {
    next()
  } else {
    await decodeToken(req, res, next)
  }
})

// Use the route files as middleware
app.use("/api", baseRoute)

module.exports = app

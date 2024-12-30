const express = require("express")
const router = express.Router()

const categoryRoutes = require("./categoryRoutes")
const subcategoryRoutes = require("./subcategoryRoutes")
const questionRoutes = require("./questionRoutes")
const sessionRoutes = require("./sessionRoutes")
const dataRoutes = require("./dataRoutes")
const loginRoute = require("./loginRoute")

router.use(categoryRoutes, subcategoryRoutes, questionRoutes, sessionRoutes, dataRoutes, loginRoute)

exports = module.exports = router

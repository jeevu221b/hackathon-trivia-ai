const express = require("express")
const router = express.Router()

const categoryRoutes = require("./categoryRoutes")
const subcategoryRoutes = require("./subcategoryRoutes")
const questionRoutes = require("./questionRoutes")
const sessionRoutes = require("./sessionRoutes")
const dataRoutes = require("./dataRoutes")
const loginRoute = require("./loginRoute")
const xpRoutes = require("./xpRoutes")
const questsRoutes = require("./questsRoute")
const cardsRoutes = require("./cardsRoute")

router.use(categoryRoutes, subcategoryRoutes, questionRoutes, sessionRoutes, dataRoutes, loginRoute, xpRoutes, questsRoutes, cardsRoutes)

exports = module.exports = router

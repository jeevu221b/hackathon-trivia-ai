const express = require("express")
const { populateCategory } = require("../jobs/populateCategory")

const router = express.Router()

router.post("/create/category", async (req, res) => {
  try {
    const body = req.body
    if (!body.categories && !body.numberOfCategories) {
      throw new Error("Invalid input")
    }
    const response = await populateCategory({ categories: body.categories, numberOfCategories: body.numberOfCategories })
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

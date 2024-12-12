const express = require("express")
const { populateSubCategory } = require("../jobs/populateSubCategory")

const router = express.Router()

router.post("/createsubcategory", async (req, res) => {
  try {
    const body = req.body
    if (!body.subcategories && !body.numberOfSubCategories) {
      throw new Error("Invalid input")
    }
    const response = await populateSubCategory({ subcategories: body.subcategories, numberOfSubCategories: body.numberOfSubCategories })
    res.status(200).send(response)
  } catch (error) {
    console.error(error)
    res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

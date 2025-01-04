const express = require("express")
const { redeemGem, addXp } = require("../utils/helper")
const router = express.Router()

router.post("/redeem/gem", async (req, res) => {
  try {
    const { internaluserId } = req.body
    if (!internaluserId) {
      throw new Error("Invalid input")
    }
    const response = await redeemGem(internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.post("/update/xp", async (req, res) => {
  try {
    const { internaluserId, score, isFirstTime } = req.body
    if (!internaluserId) {
      throw new Error("User not logged in :(")
    }
    const response = await addXp(internaluserId, score, isFirstTime)
    return res.status(200).send(response)
  } catch (error) {
    return res.status(error.statusCode || 400).send(error.message)
  }
})

module.exports = router

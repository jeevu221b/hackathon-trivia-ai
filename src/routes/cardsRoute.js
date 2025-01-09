const express = require("express")
const Card = require("../models/Card")
const User = require("../models/User")
const router = express.Router()

router.get("/show/cards", async (req, res) => {
  try {
    const response = await showCards()
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/get/card", async (req, res) => {
  try {
    const { internaluserId } = req.body
    const response = await getCards(internaluserId)
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

function showCards() {
  return Card.find({}, { name: 1, rarity: 1, spinWheelHistory: 1 })
    .lean()
    .then((result) => {
      const card = []
      for (let cards of result) {
        card.push({ item: cards.name, type: "card", rarity: cards.rarity }) // Add each card as a 'card' type
      }

      const gem = {
        item: Math.floor(Math.random() * 4) + 2 + " " + "GEMS",
        type: "gems",
      }

      const xp1 = {
        item: Math.floor(Math.random() * (500 - 30 + 1)) + 30 + " " + "XP",
        type: "xp",
      }

      const xp2 = {
        item: Math.floor(Math.random() * (500 - 30 + 1)) + 30 + " " + "XP",
        type: "xp",
      }

      return [...card, gem, xp1, xp2]
    })
    .catch((err) => err)
}

async function getCards(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new Error("User not found")
  }

  if (user.gems >= 1) {
    user.gems -= 1
    const items = await showCards()
    // Initialize spinWheelHistory if undefined
    if (!Array.isArray(user.spinWheelHistory)) {
      user.spinWheelHistory = []
    }

    const result = spinWheel(user.spinWheelHistory, items)

    // Ensure result.type is valid
    if (["xp", "gems", "card"].includes(result.type)) {
      user.spinWheelHistory.push(result.type.toString()) // Push the valid outcome (e.g., "xp", "gems", or "card")
    } else {
      throw new Error("Invalid spin outcome type")
    }
    await user.save()
    return result
  } else {
    throw new Error("Insufficient gems :(")
  }
}

function spinWheel(userSpinHistory, items) {
  // const items = [
  //   { item: "Time Freeze", type: "card", rarity: 5 },
  //   { item: "Score Drain", type: "card", rarity: 3 },
  //   { item: "5 GEMS", type: "gems" },
  //   { item: "199 XP", type: "xp" },
  //   { item: "230 XP", type: "xp" },
  // ]

  // Calculate total spins
  const totalSpins = userSpinHistory.length

  // Adjust probabilities based on total spins
  let xpWeight = 50
  let gemsWeight = 30
  let cardBaseWeight = 10

  if (totalSpins >= 10 && totalSpins < 20) {
    cardBaseWeight = 15 // Slightly increase card probability after 10 spins
    xpWeight = 45 // Reduce XP slightly
    gemsWeight = 25 // Reduce Gems slightly
  } else if (totalSpins >= 20) {
    cardBaseWeight = 25 // Further increase card probability after 20 spins
    xpWeight = 40 // Further reduce XP
    gemsWeight = 20 // Further reduce Gems
  }

  // Assign weights to items
  const weights = items.map((item) => {
    if (item.type === "xp") {
      return xpWeight
    } else if (item.type === "gems") {
      return gemsWeight
    } else if (item.type === "card") {
      return cardBaseWeight / item.rarity // Adjust card weight based on rarity
    }
    return 0
  })

  // Perform weighted random selection
  const cumulativeWeights = []
  let sum = 0

  for (let weight of weights) {
    sum += weight
    cumulativeWeights.push(sum)
  }

  const randomValue = Math.random() * sum

  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (randomValue <= cumulativeWeights[i]) {
      // Log the spin result to user history
      return { item: items[i].item, type: items[i].type } // Return the selected item
    }
  }
}

module.exports = router

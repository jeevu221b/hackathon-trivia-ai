const express = require("express")
const Card = require("../models/Card")
const User = require("../models/User")
const { addCardToUserCardscollection } = require("../utils/helper")
const { APIError, sendAPIErrorResponse } = require("../utils/errorHandler")
const commonLang = require("../config/errorLang")
const router = express.Router()

router.get("/wheel/items", async (req, res) => {
  try {
    const response = await wheelItems()
    return res.status(200).send(response)
  } catch (error) {
    console.error(error)
    return res.status(error.statusCode || 400).send(error.message)
  }
})

router.get("/wheel/spin", async (req, res) => {
  try {
    const { internaluserId, items } = req.body
    const response = await wheelSpin(internaluserId, items)
    return res.status(200).send(response)
  } catch (error) {
    return sendAPIErrorResponse(res, error)
  }
})

router.get("/get/cards", async (req, res) => {
  try {
    const response = await getCards()
    return res.status(200).send(response)
  } catch (error) {
    return sendAPIErrorResponse(res, error)
  }
})

async function wheelItems() {
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

async function retrieveCards() {
  try {
    const cards = []
    const allCards = await Card.find({}, { name: 1, rarity: 1, spinWheelHistory: 1, limit: 1 })
    for (let card of allCards) {
      cards.push({ id: card._id, item: card.name, type: "card", rarity: card.rarity, limit: card.limit }) // Add each card as a 'card' type
    }
    return cards
  } catch (error) {
    console.error(error)
    throw new Error("Error retrieving cards")
  }
}

async function wheelSpin(userId, items) {
  const user = await User.findById(userId)
  if (!user) {
    throw new APIError("User not found", 404)
  }
  const spinTheWheel = []
  if (user.gems >= 1) {
    user.gems -= 1
    const getAllCards = await retrieveCards()
    spinTheWheel.push(...getAllCards)
    for (let item of items) {
      spinTheWheel.push(item)
    }
    // Initialize spinWheelHistory if undefined
    if (!Array.isArray(user.spinWheelHistory)) {
      user.spinWheelHistory = []
    }

    const result = spinWheel(user.spinWheelHistory, spinTheWheel)

    // Ensure result.type is valid
    if (["xp", "gems", "card"].includes(result.type)) {
      user.spinWheelHistory.push(result.item.toString()) // Push the valid outcome (e.g., "xp", "gems", or "card")
      if (result.type === "gems") {
        user.gems += parseInt(result.item)
      } else if (result.type === "xp") {
        user.xp += parseInt(result.item)
      } else if (result.type === "card") {
        // find the card from the getAllCards array
        const card = getAllCards.find((c) => c.item === result.item)
        await addCardToUserCardscollection(user, card)
      }
    } else {
      throw new Error("Invalid spin outcome type")
    }
    await user.save()
    return result
  } else {
    throw new APIError(commonLang.INSUFFICIENT_GEMS, 402, "INSUFFICIENT_GEMS")
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

async function getCards() {
  try {
    const allCards = await Card.find({}, { _id: 0, cardUi: 1 }).lean()
    return allCards.map(({ cardUi }) => ({
      name: cardUi.name,
      description: cardUi.description,
      cooldown: cardUi.cooldown,
      uses: cardUi.uses,
      rarity: cardUi.rarity,
      backgroundColor: cardUi.backgroundColor,
      imageName: cardUi.name,
    }))
  } catch (error) {
    console.error(error)
    throw new Error("Error retrieving cards")
  }
}

module.exports = router

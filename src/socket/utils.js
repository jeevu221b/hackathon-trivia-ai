// const jwt = require("jsonwebtoken");

const Card = require("../models/Card")
// const { useCard } = require("./helper")

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function applyCard(cardId, currentUserId, sessions, questionIndex, io, sessionId) {
  const card = await Card.findById(cardId).lean()
  if (!card) {
    io.to(sessionId).emit("cardError", `Card not found`)
    return sessions
  }

  if (!sessions.cards[cardId]) {
    sessions.cards[cardId] = {
      cardId: card._id,
      cardName: card.cardUi.name,
      value: card.value,
      abilityType: card.abilityType,
      affectType: card.affectType,
      limit: card.limit.minQuestions,
      appliesTo: card.appliedTo,
      isPowerCard: card.isPowerCard,
      users: [],
    }
  }

  if (sessions.cards[cardId].users.length >= 1) {
    io.to(sessionId).emit("cardError", `Card already used`)
    return sessions
  }

  // check if the user already exists in the card array
  const userIndex = sessions.cards[cardId].users.findIndex((user) => user.userId === currentUserId)
  if (userIndex === -1) {
    sessions.cards[cardId].users.push({ userId: currentUserId, usedAtIndex: questionIndex })
    sessions.useCard = true
    io.to(sessionId).emit("cardUsed", `Sunno Gaun Walo!${currentUserId} applied ${card.cardUi.name}`)
  }
  return sessions
}

async function emitActiveCards(io, sessionId, sessions, currentQuestionIndex) {
  for (let card in sessions.cards) {
    if (!sessions.cards[card].isPowerCard && sessions.cards[card].users.length > 0) {
      // Iterate over all the users who have used the card
      for (let i = 0; i < sessions.cards[card].users.length; i++) {
        const userCard = sessions.cards[card].users[i]

        if (currentQuestionIndex - userCard.usedAtIndex <= sessions.cards[card].limit) {
          cardEffect(sessions.users, userCard.userId, sessions.cards[card], io, sessionId)
        }

        if (currentQuestionIndex - userCard.usedAtIndex == sessions.cards[card].limit) {
          io.to(sessionId).emit("cardExpired", `User with the userId${userCard.userId} ${sessions.cards[card].cardName} Card effect has expired`)
          // Remove the user card from the array
          sessions.cards[card].users.splice(i, 1)
          i-- // Adjust the index to account for the removed item
        }
      }
    }
  }
  return sessions.cards
}

async function emitPowerCards(io, sessionId, sessions, currentQuestionIndex, userId) {
  for (let card in sessions.cards) {
    if (sessions.cards[card].isPowerCard && sessions.cards[card].users.length > 0) {
      // Iterate over all the users who have used the card
      for (let i = 0; i < sessions.cards[card].users.length; i++) {
        const userCard = sessions.cards[card].users[i]

        if (userCard.usedAtIndex != currentQuestionIndex && currentQuestionIndex - userCard.usedAtIndex <= sessions.cards[card].limit) {
          powerCardEffect(sessions.users, userCard.userId, sessions.cards[card], io, sessionId, userId)
        }

        if (currentQuestionIndex - userCard.usedAtIndex == sessions.cards[card].limit) {
          const allAnswered = sessions?.users.every((user) => user.userId.toString() === userId || user.answerState != "notAnswered")
          console.log("ALL ANSWERED", allAnswered)
          if (allAnswered) {
            console.log("REMOVING THE USER CARD")
            io.to(sessionId).emit("cardExpired", `User with the userId${userCard.userId} ${sessions.cards[card].cardName} Card effect has expired`)
            // sessions.users.forEach((user) => {
            //   if (user.userId.toString() === userCard.userId.toString()) {
            //     if (user.card) {
            //       user.card.isOnCooldown = true // Set the cooldown
            //     }
            //   }
            // })
            // await setCardOnCooldown(card, userCard.userId)
            // // Remove the user card from the array
            // sessions.cards[card].users.splice(i, 1)
            // i-- // Adjust the index to account for the removed item
          }
        }
      }
    }
  }
  return sessions.cards
}

function cardEffect(users, applierId, card, io, sessionId) {
  let sendCard = {}

  for (let user of users) {
    if (card.appliesTo === "opponent") {
      if (applierId.toString() !== user.userId.toString()) {
        user.isApplied = true
        user.isApplier = false
      } else {
        user.isApplied = false
        user.isApplier = true
      }
    } else if (card.appliesTo === "me") {
      if (applierId.toString() === user.userId.toString()) {
        user.isApplied = true
        user.isApplier = true
      } else {
        user.isApplied = false
        user.isApplier = false
      }
    }
    if (card.abilityType === "time_manipulator") {
      sendCard.name = card.cardName
      sendCard.abilityType = card.abilityType
      sendCard.duration = card.value.time
    } else if (card.abilityType === "score_manipulator") {
      sendCard.name = card.cardName
      sendCard.abilityType = card.abilityType
      sendCard.value = card.value.score
    } else if (card.abilityType === "retry") {
      sendCard.name = card.cardName
      sendCard.abilityType = card.abilityType
      sendCard.retry = card.value.retry
    } else if (card.abilityType === "option_remover") {
      sendCard.name = card.cardName
      sendCard.abilityType = card.abilityType
      sendCard.option = card.value.option
    }
  }
  io.to(sessionId).emit("cardEffect", { card: sendCard, affectedUsers: users })
  return users
}

function powerCardEffect(users, applierId, card, io, sessionId, userId) {
  let sendCard = {}
  let affectedUsers = [] // Initialize an empty array for affected users

  for (let user of users) {
    if (card.appliesTo === "opponent") {
      if (applierId.toString() !== user.userId.toString() && user.userId.toString() === userId.toString()) {
        user.isApplied = true
        user.isApplier = false
        user.score -= card.value.score
        user.lastQuestionScore -= card.value.score

        affectedUsers.push(user) // Add the user to the affected users list
      }
    } else if (card.appliesTo === "me") {
      if (applierId.toString() === user.userId.toString() && applierId.toString() === userId.toString() && card.abilityType === "bet") {
        user.isApplied = true
        user.isApplier = true
        user.score += Math.floor((card.value.betPercentage * user.score) / 100)
        user.lastQuestionScore += card.score
        sendCard.score = Math.floor((card.value.betPercentage * user.score) / 100)

        affectedUsers.push(user) // Add the user to the affected users list
      }
    }
  }

  if (card.abilityType === "score_manipulato") {
    sendCard.name = card.cardName
    sendCard.abilityType = card.abilityType
    sendCard.value = card.value.score
  } else if (card.abilityType === "bet") {
    sendCard.name = card.cardName
    sendCard.abilityType = card.abilityType
  }

  if (affectedUsers.length !== 0) {
    io.to(sessionId).emit("cardEffect", { card: sendCard, affectedUsers }) // Emit only affected users
  }
  return affectedUsers // Return only affected users
}

module.exports = { sleep, applyCard, emitActiveCards, emitPowerCards }

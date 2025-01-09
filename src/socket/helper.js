const User = require("../models/User")

function roomUsersScore(args) {
  const { id, username, score, isOnline, userId, answerState, lastQuestionScore = 0, isMe = false } = args

  if (username === undefined) {
    throw new Error("The argument 'username' is required.")
  }
  if (typeof username !== "string") {
    throw new Error("The argument 'username' must be a string.")
  }

  if (score === undefined) {
    throw new Error("The argument 'score' is required.")
  }
  if (typeof score !== "number") {
    throw new Error("The argument 'score' must be a number.")
  }

  if (isOnline === undefined) {
    throw new Error("The argument 'isOnline' is required.")
  }
  if (typeof isOnline !== "boolean") {
    throw new Error("The argument 'isOnline' must be a boolean.")
  }

  if (userId === undefined) {
    throw new Error("The argument 'userId' is required.")
  }
  if (typeof userId !== "string") {
    throw new Error("The argument 'userId' must be a string.")
  }

  if (answerState === undefined) {
    throw new Error("The argument 'answerState' is required.")
  }
  if (!["notAnswered", "correctlyAnswered", "incorrectlyAnswered"].includes(answerState)) {
    throw new Error('The argument answerState must be one of "notAnswered", "correctlyAnswered", or "incorrectlyAnswered".')
  }

  if (lastQuestionScore === undefined) {
    throw new Error("The argument 'lastQuestionScore' is required.")
  }
  if (typeof lastQuestionScore !== "number") {
    throw new Error("The argument 'lastQuestionScore' must be a number.")
  }

  if (id === undefined) {
    throw new Error("The argument 'id' is required.")
  }
  if (typeof id !== "string") {
    throw new Error("The argument 'id' must be a string.")
  }
  return {
    username,
    score,
    isOnline,
    userId,
    answerState,
    id,
    lastQuestionScore,
    isMe,
  }
}
const streakMessages = [
  `{name} is on fire!`,
  `{name} is on an incredible streak!`,
  // `{name} is unstoppable!`,
  // `{name} is dominating!`,
  // `{name} can't be stopped!`,
]
const userStreakMessages = [
  `You are on fire!`,
  `You are on an incredible streak!`,
  // `You are unstoppable!`,
  // `You are dominating!`,
  // `You can't be stopped!`,
]

function getStreakMessage(index, name) {
  try {
    return {
      allText: streakMessages[index].replace("{name}", name),
      userText: userStreakMessages[index],
    }
  } catch {
    return `No streak message found for index ${index}`
  }
}

const removeUserFromSession = (sessions, sessionId, userId) => {
  if (sessions[sessionId]) {
    const user = sessions[sessionId]?.users.find((user) => user.userId == userId)

    if (user?.isHost && sessions[sessionId]?.users.length > 1) {
      const nextUser = sessions[sessionId]?.users.find((user) => user.userId !== userId)
      sessions[sessionId].users = sessions[sessionId]?.users.map((user) => (user.id === nextUser.id ? { ...user, isHost: true } : user))
    }

    sessions[sessionId].users = sessions[sessionId]?.users.filter((user) => user.userId !== userId)

    // If user is the last user in the room, delete the room
    if (sessions[sessionId]?.users.length === 0) {
      delete sessions[sessionId]
    }
  }
}

async function useCard(card, sessionId, currentUserId, sessions) {
  const cardData = { card: {}, users: [] }

  console.log(sessions, "SESSIONS")
  const user = await User.findById(currentUserId, { cards: 1 })
  if (!user) {
    throw new Error("User not found")
  }
  // console.log(user.cards, "USER CARDS")
  const userCard = user.cards.find((userCard) => userCard.cardId === card.id)
  if (!userCard) {
    console.log("Card not found in user's card list")
  }

  // Check if card exists and the user hasn't exhausted its usage
  if (userCard?.uses <= userCard?.maxUses) {
    if (card) {
      cardData.card = card
      // Check where the ability applies ("opponent", "self", "both")
      if (card.appliesTo === "opponent") {
        // const session = sessions[sessionId] // Access the session object
        // if (session && session.users) {
        // Iterate through all users in the given session
        // console.log(session, "Session");
        sessions?.users.forEach((user) => {
          // Apply the card effect to users who are not the current user
          if (user.userId.toString() !== currentUserId.toString()) {
            // Here you can define how the card effect is applied
            user.isApplied = true
            // user.isApplier = false
            cardData.users.push(user)
          } else {
            // user.isApplied = false
            user.isApplier = true
            cardData.users.push(user)
          }
        })
      } else if (card.appliesTo === "self") {
        console.log("Not applied to opponent ")
        sessions.users.forEach((user) => {
          if (user.userId.toString() === currentUserId.toString()) {
            user.isApplied = true
            user.isApplier = true
            cardData.users.push(user)
          } else {
            user.isApplied = false
            user.isApplier = false
            cardData.users.push(user)
          }
        })
      }
      // console.log("Card Data", cardData)
      // eventEmitter.emit("apply-card", cardData)
      userCard.uses += 1

      if (userCard.uses >= userCard.maxUses) {
        userCard.isOnCooldown = true
        userCard.cooldownStart = new Date()
      }
      user.save()
      console.log(sessions, "AFTER APPLYING CARD")
      return sessions
      // await User.updateOne({ _id: currentUserId, "cards.cardId": card.id }, { $set: { "cards.$.uses": userCard.uses } })
    }
  } else {
    console.log("Card usage exhausted")
    return sessions
  }
}

function isCardApplierInRoom(roomUsers) {
  console.log(roomUsers, "ROOM USERS")
  return roomUsers.some((user) => user.isApplier && user.isOnline)
}

module.exports = { roomUsersScore, getStreakMessage, removeUserFromSession, useCard, isCardApplierInRoom }

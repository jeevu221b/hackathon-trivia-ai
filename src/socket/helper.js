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

module.exports = { roomUsersScore, getStreakMessage, removeUserFromSession }

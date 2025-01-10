const logger = require("../config/logger")

const errorHandler = (err, req, res) => {
  logger.error(err.stack)

  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  res.status(statusCode).json({ error: message })
}

class APIError extends Error {
  constructor(message, statusCode = 400, type = "GENERAL_ERROR") {
    super(message)
    this.statusCode = statusCode
    this.type = type
  }
}

function sendAPIErrorResponse(res, error) {
  const errorType = error.type || (error.constructor && error.constructor.name) || "GENERAL_ERROR"
  return res.status(error.statusCode || 400).json({
    statusCode: error.statusCode || 400,
    type: errorType,
    message: error.message || "An unexpected error occurred.",
  })
}

module.exports = { errorHandler, APIError, sendAPIErrorResponse }

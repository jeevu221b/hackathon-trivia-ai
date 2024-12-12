const logger = require("../config/logger")

const errorHandler = (err, req, res) => {
  logger.error(err.stack)

  const statusCode = err.statusCode || 500
  const message = err.message || "Internal Server Error"

  res.status(statusCode).json({ error: message })
}

module.exports = errorHandler

const app = require("./app")
const dotenv = require("dotenv")
const connectDB = require("./config/database")
const { runCron } = require("./services/backup")
const { setupSocketIO } = require("./socket/socket")
const http = require("http")
// const { setupRedis } = require("./services/redis")

dotenv.config()
const PORT = process.env.PORT || 5000

const server = http.createServer(app)
setupSocketIO(server)

server.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB()
  runCron()
  // await setupRedis()
  console.info(`Server is running on port ${PORT}`)
})

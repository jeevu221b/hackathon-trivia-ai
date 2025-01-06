const app = require("./app")
const dotenv = require("dotenv")
const connectDB = require("./config/database")
const { runCron } = require("./services/backup")
// const { setupRedis } = require("./services/redis")

dotenv.config()
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB()
  runCron()
  // await setupRedis()
  console.info(`Server is running on port ${PORT}`)
})

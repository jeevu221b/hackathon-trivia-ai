const app = require("./app")
const dotenv = require("dotenv")
const connectDB = require("./config/database")
const { setupRedis } = require("./services/redis")

dotenv.config()
const PORT = process.env.PORT || 5000
app.listen(PORT, async () => {
  // Connect to MongoDB
  await connectDB()
  await setupRedis()
  console.info(`Server is running on port ${PORT}`)
})

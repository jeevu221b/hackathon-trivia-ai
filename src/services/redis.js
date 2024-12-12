const redis = require("redis")

let client

async function setupRedis() {
  client = await redis
    .createClient()
    .on("error", (err) => {
      console.log("Redis Client Error", err)
      // eslint-disable-next-line no-undef
      reject(err)
    })
    .connect("connect", () => {
      console.log("Redis client connected")
      // eslint-disable-next-line no-undef
      resolve()
    })
  return client
}

// Function to set a value in Redis with an expiry time in seconds
async function setRedisValueWithExpiry(key, value, expiryInSeconds) {
  return await client.set(key, value, "EX", expiryInSeconds)
}

// Function to get a value from Redis
async function getRedisValue(key) {
  return await client.get(key)
}

module.exports = {
  setRedisValueWithExpiry,
  getRedisValue,
  setupRedis,
}

const Anthropic = require("@anthropic-ai/sdk")

const { getRedisValue, setRedisValueWithExpiry } = require("../redis")

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

//Function to call the Claude API
async function claudeApi(message) {
  const cache = await getRedisValue(JSON.stringify(message))
  if (cache) {
    console.info("Returning cached Claude API response")
    return JSON.parse(cache)
  }
  console.info("Calling Claude API")
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 4096,
    temperature: 0,
    messages: message,
  })
  console.info("Claude API response received")
  console.info("Caching Claude API response")
  await setRedisValueWithExpiry(JSON.stringify(message), JSON.stringify(response), 4560)
  return response
}

module.exports = { claudeApi }

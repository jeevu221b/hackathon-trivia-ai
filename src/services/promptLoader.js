const Config = require("../models/Config")
let prompts = null

async function promptLoader() {
  if (!prompts) {
    const data = await Config.find().lean()
    prompts = data[0]
  }
  const { questionPrompt, categoryPrompt, gamePlanPrompt, subcategoryPrompt } = prompts
  return { questionPrompt, categoryPrompt, gamePlanPrompt, subcategoryPrompt }
}

module.exports = { promptLoader }

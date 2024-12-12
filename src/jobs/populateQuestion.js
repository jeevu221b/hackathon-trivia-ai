const { config } = require("../config/config")
const Level = require("../models/Level")
const Subcategory = require("../models/Subcategory")
const { claudeApi } = require("../services/claude/index")
const { parsedQuestions } = require("../utils/helper")
const { apiMessageFormat } = require("../utils/helper")
const { claudeMessageRoles } = config
const commonLang = require("../config/errorLang")
const mongodb = require("mongodb")
const { promptLoader } = require("../services/promptLoader")
const { questionPromptFormatter } = require("../temp/prompts")

// Validate the Subcategory ID \
async function subcategoryIdValidation(id) {
  if (!mongodb.ObjectId.isValid(id)) {
    return false
  }
  data = await Subcategory.findOne({ _id: id })
  if (!data) {
    return false
  }
  return true
}

// Validate Level
function levelValidation(level) {
  if (typeof level !== "number") {
    return false
  }
  if (level < 1) {
    return false
  }
  if (level > 10) {
    return false
  }
  return true
}

async function populateQuestion({ subcategoryId, level, user_id, autofill = true, override = [] }) {
  try {
    const api_message = []

    if (!subcategoryId || !level) {
      throw new Error(commonLang.MISSING_PARAM)
    }
    if (!(await subcategoryIdValidation(subcategoryId))) {
      throw new Error(commonLang.INVALID_ID)
    }
    if (!levelValidation(level)) {
      throw new Error(commonLang.INVALID_LEVEL)
    }

    const questionPrompt = (await promptLoader()).questionPrompt
    // Validate subcategory
    const subcategory = await Subcategory.findOne({ _id: subcategoryId })
    if (!subcategory) {
      throw new Error(commonLang.SUBCATEGORY_NOT_FOUND)
    }
    //Check if level exists in db
    const levelExistsInDb = await Level.findOne({ level: Number(level), subcategory: subcategoryId })
    //1. if level exists in db fetch all the questions from db and send in response
    if (levelExistsInDb && !override.includes(level)) {
      return levelExistsInDb.questions
    }

    // //2. if level does not exist in db
    if ((!levelExistsInDb && level != 1) || override.includes(level)) {
      for (let i = 1; i <= level; i++) {
        prompt = questionPromptFormatter(questionPrompt, subcategory.name, i)
        // If level exists in db, fetch all the questions from db
        levelExists = await Level.findOne({ level: i, subcategory: subcategoryId })

        //If level exists in db and is not in override, fetch all the questions from db and send in response
        if (levelExists && !override.includes(i)) {
          api_message.push(apiMessageFormat({ role: claudeMessageRoles.user, prompt }))
          api_message.push(apiMessageFormat({ role: claudeMessageRoles.assistant, prompt: JSON.stringify(levelExists.questions) }))
          continue
        }

        console.log(`Questions creating for level ${i}`)
        if (i === 1) {
          api_message.push(apiMessageFormat({ role: claudeMessageRoles.user, prompt }))
          api_message.push(apiMessageFormat({ role: claudeMessageRoles.assistant, prompt: parsedQuestions(await claudeApi(api_message)) }))
          continue
        }
        api_message.push(apiMessageFormat({ role: claudeMessageRoles.user, prompt }))
        api_message.push(apiMessageFormat({ role: claudeMessageRoles.assistant, prompt: parsedQuestions(await claudeApi(api_message)) }))
      }
    }

    //Send the data to the database
    api_message = api_message.filter((msg) => msg.role === "assistant")
    for (const [index, msg] of api_message.entries()) {
      let questions
      try {
        questions = JSON.parse(msg.content[0].text)
      } catch (err) {
        throw new Error("Error parsing the question", msg.content[0])
      }

      //validate the question object before saving against the schema
      if (!questions || !questions.length) {
        throw new Error("No questions found!")
      }

      questions.map((question) => {
        if (!question.question || !question.options || isNaN(question.answer)) {
          throw new Error("Invalid question object")
        }
        if (!question.options.length) {
          throw new Error("Question must have atleast 4 options", question)
        }
        if (typeof question.answer !== "number") {
          throw new Error("Answer must be a number", question)
        }
        if (question.answer < 0 || question.answer > 3) {
          throw new Error("Answer must be between 0 and 3", question)
        }
      })

      let db_data = {
        questions,
        subcategory: subcategoryId,
        level: Number(index + 1),
      }
      await Level.findOneAndUpdate({ subcategory: subcategoryId, level: db_data.level }, db_data, { upsert: true })
      console.log("Questions created sucessfully!", subcategoryId)
    }
  } catch (err) {
    console.log(err)
  }
}

module.exports = { populateQuestion }

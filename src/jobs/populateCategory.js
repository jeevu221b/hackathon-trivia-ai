const Category = require("../models/Category")
const { claudeApi } = require("../services/claude/index")
const { apiMessageFormat, apiError } = require("../utils/helper")
const { config } = require("../config/config")
const { claudeMessageRoles } = config
const commonLang = require("../config/errorLang")
const { promptLoader } = require("../services/promptLoader")
const { categoryPromptFormatter } = require("../temp/prompts")

// Input param validation functions:
const categoriesValidation = (categories) => {
  // example:
  //  "categories": [{
  //       "category":"Bridgerton"
  //   }]
  const isCategoriesArray = Array.isArray(categories)
  if (!isCategoriesArray) {
    return false
  }
  if (categories.length === 0) {
    return false
  }
  for (const category of categories) {
    if (category.trim() === "") return false
  }
  const allStrings = categories.every((item) => typeof item === "string")
  if (!allStrings) {
    return false // Return false if any element is not a string
  }
  return true
}

const numberOfCategoriesValidation = (numberOfCategories) => {
  if (typeof numberOfCategories !== "number") {
    return false
  }
  if (numberOfCategories % 1 !== 0) {
    return false
  }

  if (numberOfCategories < 1) {
    return false
  }
  if (numberOfCategories > 10) {
    return false
  }
  return true
}

async function populateCategory({ categories, numberOfCategories }) {
  try {
    // eslint-disable-next-line no-unused-vars
    let messages = []
    const documents = []

    // Check if both categories and numberOfCategories are present
    if ((categories || categories === "") && (numberOfCategories || numberOfCategories === "")) {
      throw new Error(commonLang.INVALID_INPUT)
    }
    // If category is given
    if (categories) {
      if (!categoriesValidation(categories)) {
        throw new Error(commonLang.CATEGORY_NOT_FOUND)
      }
      for (const category of categories) {
        documents.push(
          await Category.findOneAndUpdate(
            { name: category }, //filter
            { name: category }, //update or create
            {
              upsert: true,
              new: true,
            }
          )
        )
      }
      return documents
    }
    // If numberOfCategories is given
    if (numberOfCategories !== 0) {
      if (!numberOfCategoriesValidation(numberOfCategories)) {
        throw new Error(commonLang.NUMBER_OF_CATEGORIES_NOT_FOUND)
      }
      categories = (await Category.find().lean()).map((item) => item.name)
      let categoryprompt = (await promptLoader()).categoryPrompt
      categoryprompt = categoryPromptFormatter(categoryprompt, categories, numberOfCategories)
      messages.push(apiMessageFormat({ role: claudeMessageRoles.user, prompt: categoryprompt }))
      messages.push(await claudeApi(messages))
      const messages = messages.filter((item) => item.role === "assistant")
      const category = JSON.parse(messages[0].content.filter((item) => item.type === "text")[0].text)
      if (!Array.isArray(category)) {
        throw new Error("Category must be an array of objects")
      }
      for (const title of category) {
        if (!title.title) {
          throw new Error("Invalid category object")
        }
        const ifCategoryExist = await Category.findOne({ name: title.title })
        if (!ifCategoryExist) {
          // eslint-disable-next-line no-undef
          data = await Category.create({
            name: title.title,
          })
        }
      }
      console.log("Category created successfully")
      // eslint-disable-next-line no-undef
      return data
    }
  } catch (err) {
    throw apiError(err)
  }
}

module.exports = { populateCategory }

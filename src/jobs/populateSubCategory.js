const { claudeApi } = require("../services/claude/index")
const Category = require("../models/Category")
const SubCategory = require("../models/Subcategory")
const { apiMessageFormat, apiError } = require("../utils/helper")
const { config } = require("../config/config")
const { claudeMessageRoles } = config
const commonLang = require("../config/errorLang")
const { promptLoader } = require("../services/promptLoader")
const mongodb = require("mongodb")
const { subcategoryPromptFormatter } = require("../temp/prompts")

function validation(params) {
  for (const param of params) {
    if (
      typeof param !== "object" ||
      param === null ||
      !("subcategory" in param) ||
      !("id" in param) ||
      typeof param.subcategory !== "string" ||
      typeof param.id !== "string" ||
      param.subcategory.trim() === "" ||
      param.id.trim() === "" ||
      !mongodb.ObjectId.isValid(param.id) // <-- Add the ObjectId check
    ) {
      return false
    }
  }
  return true
}

function duplicateValidation(params) {
  for (let i = 0; i < params.length; i++) {
    for (let j = i + 1; j < params.length; j++) {
      if (params[i].id === params[j].id && params[i].subcategory === params[j].subcategory) {
        return false
      }
    }
  }
  return true
}

async function subcategoriesValidation(params) {
  // Check if params is an array
  if (!Array.isArray(params)) {
    throw new Error(commonLang.ARRAY_EXPECTED)
  }
  if (!validation(params)) {
    throw new Error(commonLang.VALIDATION_ERROR)
  }
  if (validation(params) && !duplicateValidation(params)) {
    throw new Error("DUPLICATE_ERROR")
  }
  for (const param of params) {
    const doesCategoryExist = await Category.exists({ _id: param.id })
    if (!doesCategoryExist) {
      throw new Error(commonLang.CATEGORY_NOT_FOUND)
      // return false
    }
  }
  // All checks passed, return true
  return true
}

const numberOfSubCategoriesValidation = (params) => {
  if (!Array.isArray(params)) {
    throw new Error(commonLang.ARRAY_EXPECTED)
  }
  for (const param of params) {
    if (
      typeof param !== "object" ||
      param === null ||
      !("number" in param) ||
      !("id" in param) ||
      typeof param.number !== "number" ||
      typeof param.id !== "string" ||
      param.id.trim() === "" ||
      !duplicateValidation(params) ||
      !mongodb.ObjectId.isValid(param.id)
    ) {
      return false
    }
  }
  return true
}

async function populateSubCategory({ subcategories, numberOfSubCategories }) {
  try {
    let documents = []
    let data = []

    //Check if both categories and numberOfCategories are present
    if ((subcategories || subcategories === "") && (numberOfSubCategories || numberOfSubCategories === "")) {
      throw new Error(commonLang.INVALID_INPUT)
    }

    // If subcategory is given
    if (subcategories) {
      if (!(await subcategoriesValidation(subcategories))) {
        throw new Error(commonLang.CATEGORY_NOT_FOUND)
      }
      for (const subcategory of subcategories) {
        documents.push(
          await SubCategory.findOneAndUpdate(
            { name: subcategory.subcategory }, //filter
            { name: subcategory.subcategory, category: subcategory.id }, //update or create
            {
              upsert: true,
              new: true,
            }
          )
        )
      }
      return documents
    }

    // If numberOfSubCategories is given
    if (numberOfSubCategories) {
      if (!numberOfSubCategoriesValidation(numberOfSubCategories)) {
        throw new Error(commonLang.INVALID_INPUT)
      }

      for (const subcategory of numberOfSubCategories) {
        let messages = []
        subcategories = await SubCategory.find({ category: subcategory.id }).lean()
        if (subcategories.length != 0) {
          const category = (await Category.findOne({ _id: subcategories[0].category })).name
          subcategories = subcategories.map((item) => item.name)
          let subcategoryprompt = (await promptLoader()).subcategoryPrompt
          subcategoryprompt = subcategoryPromptFormatter(subcategoryprompt, category, subcategories, subcategory.number)
          messages.push(apiMessageFormat({ role: claudeMessageRoles.user, prompt: subcategoryprompt }))
          messages.push(await claudeApi(messages))
          messages = messages.filter((item) => item.role === "assistant")
          const api_subcategory = JSON.parse(messages[0].content.filter((item) => item.type === "text")[0].text)
          if (!Array.isArray(category)) {
            throw new Error("Category must be an array of objects")
          }
          for (const title of api_subcategory) {
            if (!title.title) {
              throw new Error("Invalid subcategory object")
            }
            let ifSubCategoryExist = await SubCategory.findOne({ name: title.title })
            if (!ifSubCategoryExist) {
              data.push(
                await SubCategory.create({
                  name: title.title,
                  category: subcategory.id,
                })
              )
            }
          }
          console.log("Subcategory created successfully")
        }
      }
    }
    return data
  } catch (error) {
    throw apiError(error)
  }
}

module.exports = { populateSubCategory }

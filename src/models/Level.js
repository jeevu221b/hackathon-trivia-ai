const mongoose = require("mongoose")

//dummy imageConfigSchema
// const imageConfig = {
//   girdWidth: 10,
//   girdHeight: 10,
//   imageSrc: "https://d31xsmoz1lk3y3.cloudfront.net/games/images/map_img_831761_1562185949.jpg",
//   imageWidth: 292,
//   imageHeight: 146,
//   cornerRadius: 100,
// }

const imageConfigSchema = new mongoose.Schema(
  {
    gridWidth: {
      type: Number,
      required: true,
    },
    gridHeight: {
      type: Number,
      required: true,
    },
    imageSrc: {
      type: String,
      required: true,
    },
    imageWidth: {
      type: Number,
      required: true,
    },
    imageHeight: {
      type: Number,
    },
    cornerRadius: {
      type: Number,
    },
  },
  { timestamps: true }
)

const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v.length >= 2
        },
        message: "A question must not have more than 4 choices",
      },
    },
    answer: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    image: {
      type: String,
    },
    type: {
      type: String,
      required: true,
      enum: ["image", "audio", "video"],
    },
    gridRow: {
      type: Number,
    },
    gridColumn: {
      type: Number,
    },
    imageType: {
      type: String,
      enum: ["logo", "tall", "wide", "grid"],
      default: "wide",
    },
  },
  { timestamps: true }
)

const LevelSchema = new mongoose.Schema(
  {
    questions: {
      type: [QuestionSchema],
      required: true,
    },
    imageConfig: {
      type: imageConfigSchema,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
    },
    level: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Level", LevelSchema)

const mongoose = require("mongoose")

const metaDataSchema = new mongoose.Schema({
  type: {
    type: String,
    trim: true,
    default: "",
  },
  imageSrc: {
    type: String,
    trim: true,
    default: "",
  },
  wikiTitle: {
    type: String,
    trim: true,
    default: "",
  },
  platform: {
    type: String,
    trim: true,
    default: "",
  },
  platformLink: {
    type: String,
    trim: true,
    default: "",
  },
  showInfo: {
    type: Boolean,
    default: false,
  },
  isWatched: {
    type: Boolean,
    default: false,
  },
  inWatchlist: {
    type: Boolean,
    default: false,
  },
  userCount: {
    type: Number,
    default: 0,
  },
})

module.exports = metaDataSchema

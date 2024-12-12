const User = require("../../models/User")

//Return the user document if they exist, otherwise create a new user and then return its
async function signUp({ email }) {
  try {
    return await User.findOneAndUpdate(
      { email }, //filter
      { email }, //update or create
      {
        //options
        // If the user does not exist, create a new user
        upsert: true,
        returnOriginal: true,
      }
    )
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = { signUp }

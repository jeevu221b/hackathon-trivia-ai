// const jwt = require("jsonwebtoken");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// const getDecodedToken = (token, secretKey) => {
//   let decodedToken;
//   try {
//     decodedToken = jwt.verify(token, secretKey);
//     console.log("Decoded token:", decodedToken);
//   } catch (err) {
//     console.error("Token verification failed:", err);
//   }
//   return decodedToken;
// };

module.exports = { sleep }

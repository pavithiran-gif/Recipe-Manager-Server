require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  apiKey: process.env.API_KEY,
  accountUrl: process.env.ACCOUNT_URL,
  jwtSecret: process.env.JWT_SECRET,
};

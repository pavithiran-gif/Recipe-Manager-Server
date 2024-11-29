const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");

const generateToken = (payload, rememberMe) => {
  const expiresIn = rememberMe ? "24h" : "1h";
  const token = jwt.sign(payload, jwtSecret, { expiresIn });
  // console.log(token);
  return {
    token,
  };
};

module.exports = {
  generateToken,
};

// const jwt = require("jsonwebtoken");
// const { jwtSecret } = require("../config/config");

// const authenticateToken = (req, res, next) => {
//   // const token = req.headers["authorization"]?.split(" ")[1];
//   const token = req.body;

//   if (!token) {
//     return res.status(401).json({ message: "No token provided" });
//   }

//   jwt.verify(token, jwtSecret, (err, user) => {
//     if (err) {
//       if (err.name === "TokenExpiredError") {
//         console.log("Token expired");
//         return res.status(401).json({ message: "Token expired" });
//       }
//       console.log("Invalid token");
//       return res.status(403).json({ message: "Invalid token" });
//     }

//     req.user = user;
//     next();
//   });
// };

// module.exports = authenticateToken;

const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/config");
const logger = require("../utils/logger");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Check if the Authorization header is present and properly formatted
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    // console.log(token);
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log("Token expired");
        logger.info("Token expired");
        return res.status(401).json({ message: "Token expired" });
      }
      console.log("Invalid token");
      logger.info("Invalid token");
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = user; // Store the user info from the token in the request object
    next(); // Move to the next middleware or route handler
  });
};

module.exports = authenticateToken;

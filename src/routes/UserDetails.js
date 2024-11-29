const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { getPersonByEmail } = require("../components/user_details");
const { jwtSecret } = require("../config/config");
const logger = require("../utils/logger");

router.get("/useremail", async (req, res) => {
  try {
    // console.log(
    //   `Running user detail function: ${req.headers["authorization"]}`
    // );
    // Step 1: Get the token from the Authorization header (Bearer token)
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token is required" });
    }

    // Extract the token from the Bearer string
    const token = authHeader && authHeader.split(" ")[1]; // Bearer token

    // Step 2: Verify and decode the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, jwtSecret);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Step 3: Extract email from the decoded token
    const email = decodedToken.email; // Assuming 'email' is stored in the token payload

    console.log(`email for the sidebar send to frontend ui`);

    if (!email) {
      return res.status(400).json({ error: "Email not found in token" });
    }

    // Step 4: Get the person details using the email
    const personDetails = await getPersonByEmail(email);
    // console.log(personDetails);

    if (!personDetails) {
      return res.status(404).json({ error: "User not found" });
    }

    // Step 5: Send the person details as the response
    res.status(200).json(personDetails);
  } catch (error) {
    console.error("Error in /userdetail:", error);
    logger.error("Error in /userdetail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

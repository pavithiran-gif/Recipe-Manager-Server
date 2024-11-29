const express = require("express");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/jwt");
const router = express.Router();
// const { generateTOTP } = require("../components/otp_gen");
const { generateAndCacheOTP } = require("../components/otp_gen");
const { sendOTPEmail, otpCache } = require("../components/email_otp");
const { insertLoginLog } = require("../components/email_db_check");
const {
  checkIfUserRegistered,
  updateUserPasswordByEmail,
  updateUserEmailprofile,
} = require("../components/email_existance");
const {
  // getPeopleIdByEmail,
  registerUser,
  getUserByEmail,
} = require("../components/reg_user_db");
// const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const users = [
  {
    id: 1,
    email: "test@ai.com",
    password: "$2a$12$Kso4nPKayocVhfXDBNtbB.QdNZXmcFbE.RipYiRZPrFvedULvU2Um", // hashed 'password'
  },
];

router.post("/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Fetch the user by email from the database
    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "Email address not found" });
    }

    // Compare the provided password with the hashed password in the database
    const validPassword = await bcrypt.compare(password, user.login_password);

    if (!validPassword) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // Generate a token
    const token = generateToken(
      { userId: user.auth_user_id, email: user.reg_email },
      rememberMe
    );

    // try {
    //   console.log(token);
    //   const decoded = jwt.decode(token.token); // Decodes the token without verifying signature
    //   console.log("Decoded JWT payload:", decoded);
    // } catch (err) {
    //   console.error("Failed to decode token:", err);
    // }

  // Insert the login record into UserLoginLogs table
  // await insertLoginLog(email);

    res.status(200).json({
      message: "Login successful",
      token: token,
    });
  } catch (error) {
    console.error("Error in /login:", error);
    logger.error("Error in /login:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  // Check if email exists in the database
  // const emailExists = await checkEmailInDB(email);

  // if (!emailExists) {
  //   return res.status(400).json({
  //     success: false,
  //     message:
  //       "Not an internal email ID! (Only triyam employee could Register)",
  //   });
  // }

  // Check if the user is already registered
  const user = await checkIfUserRegistered(email);

  if (user) {
    return res.status(400).json({
      success: false,
      message: "User already registered. Please log in.",
    });
  }

  const otp = generateAndCacheOTP(email);

  // Send OTP email
  sendOTPEmail(email, otp);

  res.status(200).json({ success: true, message: "OTP sent to your email" });
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required." });
  }

  const cachedOTP = otpCache.get(email);

  if (cachedOTP === otp) {
    res.status(200).json({ success: true, message: "OTP verified!" });
  } else {
    res
      .status(400)
      .json({ success: false, message: "Invalid OTP. Please try again." });
  }
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log(`Registered user : ${email}`);
  logger.info(`Registered user : ${email}`);

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if the user is already registered
    const user = await checkIfUserRegistered(email);

    if (user) {
      console.log("User already registered. Please log in.");
      return res.status(400).json({
        success: false,
        message: "User already registered. Please log in.",
      });
    }
    // Get people_id by email
    // const people_id = await getPeopleIdByEmail(email);

    // if (!people_id) {
    //   return res.status(400).json({
    //     error: "Email not found in internal records (People table).",
    //   });
    // }

    // Hash the password
    const updateuseremaildetail = await updateUserEmailprofile(email);
    if (updateuseremaildetail) {
      console.log("user email updated in user_detail table");
      };

    const hashedPassword = await bcrypt.hash(password, 10);

    // Register the new user
    const userRegistered = await registerUser(email, hashedPassword);

    if (userRegistered) {
      return res.status(201).json({ message: "User registered successfully" });
    } else {
      return res.status(500).json({ error: "Failed to register user" });
    }
  } catch (error) {
    console.error("Error in /register:", error);
    logger.error("Error in /register:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-pass-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if the user is already registered
    const user = await checkIfUserRegistered(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not registered. Please check the email address.",
      });
    }

    // Generate and cache OTP
    const otp = generateAndCacheOTP(email);

    // Send OTP email
    sendOTPEmail(email, otp);

    res.status(200).json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error in /forgot-pass-otp:", error);
    logger.error("Error in /forgot-pass-otp:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and new password are required" });
  }

  try {
    // Check if the user is already registered
    const user = await checkIfUserRegistered(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not registered. Please check the email address.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in the database
    const updateSuccess = await updateUserPasswordByEmail(
      email,
      hashedPassword
    );

    if (updateSuccess) {
      return res.status(200).json({ message: "Password reset successfully" });
    } else {
      return res.status(500).json({ error: "Failed to reset password" });
    }
  } catch (error) {
    console.error("Error in /reset-password:", error);
    logger.error("Error in /reset-password:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

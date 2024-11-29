const nodemailer = require("nodemailer");
const Mailgen = require("mailgen");
const NodeCache = require("node-cache");
const { emailid, emailpass } = require("../config/email_config");
const logger = require("../utils/logger");

// Initialize node-cache instance
const otpCache = new NodeCache({ stdTTL: 300 }); // OTP expires in 300 seconds (5 minutes)

const sendOTPEmail = (userEmail, otp) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailid,
      pass: emailpass,
    },
  });

  let MailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Triyam R&D Team",
      link: "https://www.triyam.com/",
    },
  });

  let response = {
    body: {
      name: "Dear User",
      intro:
        "Your OTP for registration is below. This OTP is valid for 5 minutes.",
      table: {
        data: [
          {
            OTP: `<span style="font-size: 35px; font-weight: bold;">${otp}</span>`,
          },
        ],
        columns: {
          // Change the width of the columns if necessary
          customWidth: {
            OTP: "100%",
          },
          // Align the text to the center
          customAlignment: {
            OTP: "center",
          },
        },
      },
      action: {
        instructions: "Please use the above OTP to complete your registration.",
        button: {
          color: "#22BC66",
          text: "Visit Our Website",
          link: "https://orange-island-0e73ecb0f.5.azurestaticapps.net",
        },
      },
      outro:
        "If you did not initiate this registration, please ignore this email.",
    },
  };

  let mail = MailGenerator.generate(response);

  let message = {
    from: emailid,
    to: userEmail,
    subject: "Your OTP for Registration",
    html: mail,
  };

  transporter
    .sendMail(message)
    .then(() => {
      console.log("Email sent successfully");
      logger.info("Email sent successfully");
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      logger.error("Error sending email:", error);
    });
};

module.exports = {
  sendOTPEmail,
  otpCache,
};

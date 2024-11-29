// totpGenerator.js
const crypto = require("crypto");
const { otpCache } = require("./email_otp");

function generateTOTP(timeStep = 30, digits = 6, algorithm = "sha256") {
  const secret = crypto.randomBytes(20).toString("base64"); // Generate a random base64 secret
  const epoch = Math.round(new Date().getTime() / 1000.0);
  let timeCounter = Math.floor(epoch / timeStep);

  const key = Buffer.from(secret, "base64");
  const timeBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    timeBuffer[i] = timeCounter & 0xff;
    timeCounter >>= 8;
  }

  const hmac = crypto.createHmac(algorithm, key).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;

  return code.toString().padStart(digits, "0");
}

// function generateAndCacheOTP(email) {
//   const otp = generateTOTP(30, 6, "sha256");
//   otpCache.set(email, otp); // Cache the OTP with the email as the key
//   return otp;
// }

function generateAndCacheOTP(email) {
  if (otpCache.has(email)) {
    return otpCache.get(email); // Return the OTP from cache if it exists
  } else {
    const otp = generateTOTP(30, 6, "sha256");
    otpCache.set(email, otp); // Cache the OTP with the email as the key
    return otp;
  }
}

module.exports = {
  generateAndCacheOTP,
};

// const otp = generateTOTP(30, 6, 'sha256'); // usage

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

// Define a custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create the logger instance
const logger = createLogger({
  level: "info", // Set the default logging level
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize(), // Add colors for console output
    logFormat
  ),
  transports: [
    // Console transport for development
    new transports.Console(),
    // File transport for logs
    new transports.File({ filename: "logs/error.log", level: "error" }), // Only errors
    new transports.File({ filename: "logs/combined.log" }) // All logs
  ],
  exceptionHandlers: [
    new transports.File({ filename: "logs/exceptions.log" })
  ]
});

module.exports = logger;

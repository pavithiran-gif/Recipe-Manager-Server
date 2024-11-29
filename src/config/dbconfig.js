// const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    enableArithAbort: true,
    trustServerCertificate: true, // Trust self-signed certificates
  },
  requestTimeout: 30000, // 30 seconds
  connectionTimeout: 30000, // 30 seconds
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
}
};

let pool;

// Initialize the SQL connection pool
const getPool = async () => {
  if (!pool) {
    try {
      pool = await sql.connect(config);
      console.log("SQL connected");
    } catch (err) {
      console.error("Error connecting to SQL:", err);
      throw err;
    }
  }
  return pool;
};


module.exports = config;

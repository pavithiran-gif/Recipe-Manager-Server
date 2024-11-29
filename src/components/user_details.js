const sql = require("mssql");
const config = require("../config/dbconfig");
const logger = require("../utils/logger");

const getPersonByEmail = async (email) => {
  try {
    // Establish the connection pool
    const pool = await sql.connect(config);

    // Perform the parameterized query
    const result = await pool.request().input("email", sql.VarChar, email) // Parameterize the email input
      .query(`SELECT email_id FROM user_detail WHERE email_id = @email`); // Use @email as the placeholder

    // Return the first record if it exists
    return result.recordset[0]; // Return the person’s details
  } catch (err) {
    console.error("SQL error:", err);
    logger.error("SQL error:", err);
    throw err; // Re-throw error to handle it in the calling code
  }
};

module.exports = {
  getPersonByEmail,
};

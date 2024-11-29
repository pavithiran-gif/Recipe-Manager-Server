const sql = require("mssql");
const config = require("../config/dbconfig");
const logger = require("../utils/logger");

// Function to check if email exists in the database
// const checkEmailInDB = async (email) => {
//   let pool;
//   try {
//     pool = await sql.connect(config);
//     const result = await pool
//       .request()
//       .input("email", sql.NVarChar, email)
//       .query(
//         "SELECT people_id, people_email FROM People WHERE people_email = @email"
//       );

//     return result.recordset.length > 0;
//   } catch (error) {
//     console.error("Database query failed:", error);
//     logger.error("Database query failed:", error);
//     return false;
//   } finally {
//     if (pool) {
//       await pool.close();
//     }
//   }
// };


const insertLoginLog = async (email) => {
  try {
    const query = `
      INSERT INTO UserLoginLogs (Email, LoginTime)
      VALUES (@Email, GETDATE())
    `;

    // Assuming you are using an MSSQL client (like `mssql` or similar)
    const pool = await sql.connect(config); // `config` is your DB connection config
    await pool.request().input("Email", sql.NVarChar, email).query(query);

    console.log("Login log inserted successfully for:", email);
    logger.info("Login log inserted successfully for:", email);
  } catch (err) {
    console.error("Error inserting login log:", err);
    logger.error("Error inserting login log:", err);
  }
};


module.exports = {
  // checkEmailInDB,
  insertLoginLog,
};

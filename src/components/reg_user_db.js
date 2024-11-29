const sql = require("mssql");
const config = require("../config/dbconfig");
const logger = require("../utils/logger");

// Function to get people_id by email
// const getPeopleIdByEmail = async (email) => {
//   let pool;
//   try {
//     pool = await sql.connect(config);
//     const result = await pool
//       .request()
//       .input("email", sql.NVarChar, email)
//       .query("SELECT people_id FROM People WHERE people_email = @email");

//     if (result.recordset.length > 0) {
//       return result.recordset[0].people_id;
//     }

//     return null; // Return null if people_id not found
//   } catch (error) {
//     console.error("Error fetching people_id:", error);
//     logger.error("Error fetching people_id:", error);
//     throw error; // Rethrow the error for handling in the route
//   } finally {
//     if (pool) {
//       await pool.close();
//     }
//   }
// };

// Function to register a new user
const registerUser = async (email, hashedPassword) => {
  let pool;
  try {
    pool = await sql.connect(config);

    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Check if the email is already registered
      const checkResult = await transaction
        .request()
        .input("email", sql.NVarChar, email)
        .query(
          "SELECT COUNT(*) AS count FROM auth_users WHERE reg_email = @email"
        );

      if (checkResult.recordset[0].count > 0) {
        await transaction.rollback();
        throw new Error("Email is already registered.");
      }

      // Insert the new user record
      const result = await transaction
        .request()
        .input("reg_email", sql.NVarChar, email)
        .input("login_password", sql.NVarChar, hashedPassword)
        .input("reg_date", sql.DateTime, new Date())
        .query(
          "INSERT INTO auth_users (reg_email, login_password, reg_date) " +
            "VALUES (@reg_email, @login_password, @reg_date)"
        );

      await transaction.commit();
      return result.rowsAffected[0] > 0; // Return true if insertion was successful
    } catch (error) {
      await transaction.rollback();
      throw error; // Rethrow the error for handling in the route
    }
  } catch (error) {
    console.error("Error registering user:", error);
    logger.error("Error registering user:", error);
    throw error; // Rethrow the error for handling in the route
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};

const getUserByEmail = async (email) => {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(
        "SELECT auth_user_id, reg_email, login_password FROM auth_users WHERE reg_email = @email"
      );

    if (result.recordset.length > 0) {
      return result.recordset[0]; // Return the user if found
    }

    return null; // Return null if user not found
  } catch (error) {
    console.error("Error fetching user by email:", error);
    logger.error("Error fetching user by email:", error);
    throw error; // Rethrow the error for handling in the route
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};

module.exports = {
  // getPeopleIdByEmail,
  registerUser,
  getUserByEmail,
};

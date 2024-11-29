const sql = require("mssql");
const config = require("../config/dbconfig");
const logger = require("../utils/logger");

// Function to check if the user is already registered
const checkIfUserRegistered = async (email) => {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query(
        "SELECT auth_user_id, reg_email, login_password FROM Auth_Users WHERE reg_email = @email"
      );

    if (result.recordset.length > 0) {
      return result.recordset[0]; // Return the user if found
    }

    return null; // Return null if user not found
  } catch (error) {
    console.error("Database query failed:", error);
    logger.error("Database query failed:", error);
    return null; // Return null in case of error
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};

// Function to update the user's password by email
const updateUserPasswordByEmail = async (email, hashedPassword) => {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .input("hashedPassword", sql.NVarChar, hashedPassword)
      .query(
        "UPDATE Auth_Users SET login_password = @hashedPassword WHERE reg_email = @email"
      );

    // Check if the update was successful by looking at affectedRows
    if (result.rowsAffected[0] > 0) {
      return true; // Password updated successfully
    } else {
      return false; // No rows affected, update failed
    }
  } catch (error) {
    console.error("Database query failed:", error);
    logger.error("Database query failed:", error);
    return false; // Return false in case of error
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};
const updateUserEmailprofile = async (email) => {
  let pool;
  try {
    pool = await sql.connect(config);
    const result = await pool
    .request()
    .input("email", sql.NVarChar, email)
    .query(`
      IF EXISTS (SELECT 1 FROM user_detail WHERE email_id = @email)
      BEGIN
        -- If email_id exists, update the email_id
        UPDATE user_detail 
        SET email_id = @email, updated_at = GETDATE()  -- Update timestamp
        WHERE email_id = @email;
      END
      ELSE
      BEGIN
        -- If email_id doesn't exist, insert a new record
        INSERT INTO user_detail (email_id, created_at, updated_at)
        VALUES (@email, GETDATE(), GETDATE());
      END
    `);
    if (result.rowsAffected[0] > 0) {
      return true; // Password updated successfully
    } else {
      return false; // No rows affected, update failed
    }

    logger.info(`Email ${email} processed successfully.`);
  } catch (error) {
    console.error("Database query failed:", error);
    logger.error("Database query failed:", error);
    return false; // Return false in case of error
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};



module.exports = {
  checkIfUserRegistered,
  updateUserPasswordByEmail,
  updateUserEmailprofile,
};

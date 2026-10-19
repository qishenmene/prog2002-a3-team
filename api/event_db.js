/**
 * Creates the database connection for the Charity Events project.
 *
 * Reads private connection settings from the ignored db-details.js file.
 * Environment variables take priority when they are configured.
 *
 * @author Shixiang Tang, Jihan Qu
 * @version 2.0
 * @since 2026-10-04
 * @updated 2026-10-17
 */
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const detailsFile = path.join(__dirname, "db-details.js");
const dbDetails = fs.existsSync(detailsFile) ? require(detailsFile) : {};

/**
 * Creates a MySQL database connection object.
 *
 * @returns {Object} The MySQL connection object.
 */
function getConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST || dbDetails.host || "localhost",
        user: process.env.DB_USER || dbDetails.user,
        password: process.env.DB_PASSWORD || dbDetails.password,
        database: process.env.DB_NAME || dbDetails.database,
        port: process.env.DB_PORT || dbDetails.port || 3306,
        dateStrings: true,
        // Keeps DECIMAL columns as numbers instead of strings.
        decimalNumbers: true
    });
}

module.exports = {
    getConnection
};

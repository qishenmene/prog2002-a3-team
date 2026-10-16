/**
 * Creates the database connection for the Charity Events project.
 *
 * @author Shixiang Tang
 * @version 1.0
 * @since 2026-10-04
 */
const mysql = require("mysql2");
const dbDetails = require("./db-details");

/**
 * Creates a MySQL database connection object.
 *
 * @returns {Object} The MySQL connection object.
 */
function getConnection() {
    return mysql.createConnection({
        host: dbDetails.host,
        user: dbDetails.user,
        password: dbDetails.password,
        database: dbDetails.database,
        dateStrings: true
    });
}

module.exports = {
    getConnection
};
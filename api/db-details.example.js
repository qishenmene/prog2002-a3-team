/**
 * Example database credentials for the Charity Events API.
 *
 * Copy this file to db-details.js and fill in your own MySQL details:
 *     cp db-details.example.js db-details.js
 *
 * db-details.js is listed in .gitignore so the password is never committed.
 * On the cPanel server the same values can also be supplied as environment
 * variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME), which is the recommended
 * option for the deployed website.
 */
module.exports = {
    host: "localhost",
    user: "root",
    password: "",
    database: "charityevents_db",
    port: 3306
};

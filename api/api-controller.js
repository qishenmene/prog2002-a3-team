/**
 * Defines API routes for the Charity Events project.
 *
 * @author Shixiang Tang
 * @version 1.0
 * @since 2026-10-04
 */
const eventDb = require("./event_db");
const express = require("express");

const connectionObj = eventDb.getConnection();
connectionObj.connect();

const router = express.Router();

/**
 * Receives a GET /events request, retrieves event data from the database, and returns it to the client.
 *
 * @param {Object} req The HTTP request object from the client, currently unused.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.get("/events", function (req, res) {
    connectionObj.query(
        "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_date >= CURDATE() AND event_availability = 'Available';",
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Oops, something went wrong on the server. Please try again later."
                });
            }
            res.json(results);
        }
    );
});

/**
 * Receives a GET /categories request, retrieves category data from the database, and returns it to the client.
 *
 * @param {Object} req The HTTP request object from the client, currently unused.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.get("/categories", function (req, res) {
    connectionObj.query(
        "SELECT * FROM categories;",
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Oops, something went wrong on the server. Please try again later."
                });
            }
            res.json(results);
        }
    );
});

/**
 * Searches for events using the provided search criteria.
 *
 * @param {Object} req The HTTP request object from the client.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.get("/events/search", function (req, res) {
    const date = req.query.date;
    const location = req.query.location;
    const category = req.query.category;
    const conditions = [];
    const values = [];
    if (date) {
        conditions.push("event_date = ?");
        values.push(date);
    }
    if (location) {
        conditions.push("event_address LIKE ?");
        values.push("%" + location + "%");
    }
    if (category) {
        conditions.push("event_category_id = ?");
        values.push(category);
    }

    const conditionSQL = conditions.join(" AND ");
    let sql = "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_availability = 'Available'";
    if (conditions.length > 0) {
        sql = sql + " AND " + conditionSQL;
    }
    connectionObj.query(
        sql,
        values,
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Oops, something went wrong on the server. Please try again later."
                });
            }
            res.json(results);
        }
    );
});

/**
 * Accepts an event ID, queries the event, and returns its detailed information.
 *
 * @param {Object} req The HTTP request object from the client.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.get("/events/:id", function (req, res) {
    const eventId = req.params.id;
    connectionObj.query(
        "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_availability = 'Available' AND event_id = ?",
        [eventId],
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Oops, something went wrong on the server. Please try again later."
                });
            }
            if (results.length === 0) {
                return res.status(404).json({
                    message: "Event not found."
                });
            }
            return res.json(results[0]);
        }
    );
});

module.exports = router;
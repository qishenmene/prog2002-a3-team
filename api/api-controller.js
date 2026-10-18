/**
 * Defines API routes for the Charity Events project.
 * A3 UPDATE: Added CRUD operations and registrations endpoints
 *
 * @author Shixiang Tang (A2), Jihan Qu (A3 extensions)
 * @version 2.0
 * @since 2026-10-04
 * @updated 2026-10-19
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
    let sql = "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_availability = 'Available' AND event_date >= CURDATE()";
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
 * GET /events/all - Admin only: every event regardless of date or availability,
 * with category name and registration count. Ordered by date descending.
 */
router.get("/events/all", function (req, res) {
    connectionObj.query(
        `SELECT events.*, categories.category_name,
                (SELECT COUNT(*) FROM registrations WHERE registrations.event_id = events.event_id) AS registration_count
         FROM events
         JOIN categories ON events.event_category_id = categories.category_id
         ORDER BY event_date DESC, event_time DESC;`,
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: "Oops, something went wrong on the server. Please try again later." });
            }
            res.json(results);
        }
    );
});

/**
 * Retrieves an event for the admin edit form, including past and suspended events.
 * Responds with 400 for an invalid ID, 404 for a missing event, or 500 on a database error.
 *
 * @param {Object} req - The HTTP request containing the event ID in req.params.id.
 * @param {Object} res - The HTTP response used to send event data or an error.
 * @returns {void} Sends a JSON response to the administrator.
 */
function getAdminEvent(req, res) {
    const eventId = Number(req.params.id);
    if (!Number.isSafeInteger(eventId) || eventId < 1) {
        res.status(400).json({ message: "Event ID must be a positive integer." });
        return;
    }

    connectionObj.query(
        "SELECT events.*, categories.category_name FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE events.event_id = ?",
        [eventId],
        function (err, results) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "Oops, something went wrong on the server. Please try again later."
                });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: "Event not found." });
                return;
            }
            res.json(results[0]);
        }
    );
}

router.get("/admin/events/:id", getAdminEvent);

/**
 * Retrieves a public event and its complete registration list in one response.
 * Existing event fields stay at the top level; registrations are newest first.
 * Returns 400 for an invalid ID, 404 for a missing or suspended event, and 500
 * if either database read fails, so a failed read is not shown as an empty list.
 *
 * @param {Object} req - The HTTP request containing the event ID in req.params.id.
 * @param {Object} res - The HTTP response used to send the event or an error.
 * @returns {void} Sends event details and a registrations array as JSON.
 */
function getEventDetails(req, res) {
    const eventId = Number(req.params.id);
    if (!Number.isSafeInteger(eventId) || eventId < 1) {
        res.status(400).json({ message: "Event ID must be a positive integer." });
        return;
    }

    connectionObj.query(
        "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_availability = 'Available' AND events.event_id = ?",
        [eventId],
        function (err, results) {
            if (err) {
                console.error(err);
                res.status(500).json({
                    message: "Oops, something went wrong on the server. Please try again later."
                });
                return;
            }
            if (results.length === 0) {
                res.status(404).json({ message: "Event not found." });
                return;
            }

            connectionObj.query(
                "SELECT * FROM registrations WHERE event_id = ? ORDER BY registration_date DESC, registration_id DESC",
                [eventId],
                function (registrationError, registrations) {
                    if (registrationError) {
                        console.error(registrationError);
                        res.status(500).json({
                            message: "Oops, something went wrong on the server. Please try again later."
                        });
                        return;
                    }
                    res.json({ ...results[0], registrations });
                }
            );
        }
    );
}

router.get("/events/:id", getEventDetails);

/**
 * GET /events/:id/registrations - Get all registrations for a specific event (A3 NEW)
 * Returns registration list ordered by registration date (newest first)
 *
 * @param {Object} req The HTTP request object from the client.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.get("/events/:id/registrations", function (req, res) {
    const eventId = req.params.id;
    connectionObj.query(
        "SELECT * FROM registrations WHERE event_id = ? ORDER BY registration_date DESC",
        [eventId],
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
 * POST /api/events - Create a new event (A3 NEW)
 *
 * @param {Object} req The HTTP request object from the client with event data in body.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.post("/events", function (req, res) {
    const { event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_category_id, event_organisation_id } = req.body;

    // Validation
    if (!event_name || !event_date || !event_time || !event_address || !event_category_id) {
        return res.status(400).json({
            message: "Missing required fields: event_name, event_date, event_time, event_address, event_category_id"
        });
    }

    const sql = `INSERT INTO events (event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_goal_raised_amount, event_category_id, event_organisation_id, event_availability)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Available')`;

    connectionObj.query(
        sql,
        [event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_category_id, event_organisation_id || 1],
        function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Failed to create event. Please check your input and try again."
                });
            }
            res.status(201).json({
                message: "Event created successfully",
                event_id: result.insertId
            });
        }
    );
});

/**
 * PUT /api/events/:id - Update an existing event (A3 NEW)
 *
 * @param {Object} req The HTTP request object from the client with updated event data in body.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.put("/events/:id", function (req, res) {
    const eventId = req.params.id;
    const { event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_category_id, event_availability } = req.body;

    const sql = `UPDATE events SET event_name=?, event_date=?, event_time=?, event_address=?, event_purpose=?, event_description=?, event_ticket_price=?, event_goal_amount=?, event_category_id=?, event_availability=? WHERE event_id=?`;

    connectionObj.query(
        sql,
        [event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_category_id, event_availability, eventId],
        function (err, result) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Failed to update event. Please try again later."
                });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Event not found."
                });
            }
            res.json({
                message: "Event updated successfully"
            });
        }
    );
});

/**
 * DELETE /api/events/:id - Delete an event (A3 NEW)
 * Prevents deletion if event has registrations
 *
 * @param {Object} req The HTTP request object from the client.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.delete("/events/:id", function (req, res) {
    const eventId = req.params.id;

    // First check if event has registrations
    connectionObj.query(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ?",
        [eventId],
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Failed to check registrations. Please try again later."
                });
            }

            if (results[0].count > 0) {
                return res.status(400).json({
                    message: `Cannot delete event. It has ${results[0].count} registration(s). Please remove all registrations first.`
                });
            }

            // No registrations, proceed with deletion
            connectionObj.query(
                "DELETE FROM events WHERE event_id = ?",
                [eventId],
                function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: "Failed to delete event. Please try again later."
                        });
                    }
                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Event not found."
                        });
                    }
                    res.json({
                        message: "Event deleted successfully"
                    });
                }
            );
        }
    );
});

/**
 * POST /api/registrations - Register a user for an event (A3 NEW)
 *
 * @param {Object} req The HTTP request object from the client with registration data in body.
 * @param {Object} res The HTTP response object used to send data back to the client.
 */
router.post("/registrations", function (req, res) {
    const { event_id, user_name, user_email, user_phone, num_tickets } = req.body;

    // Validation
    if (!event_id || !user_name || !user_email || !num_tickets) {
        return res.status(400).json({
            message: "Missing required fields: event_id, user_name, user_email, num_tickets"
        });
    }

    // Check if user already registered for this event
    connectionObj.query(
        "SELECT * FROM registrations WHERE event_id = ? AND user_email = ?",
        [event_id, user_email],
        function (err, results) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Failed to check existing registration. Please try again later."
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message: "You have already registered for this event."
                });
            }

            // Insert new registration
            const sql = "INSERT INTO registrations (event_id, user_name, user_email, user_phone, num_tickets) VALUES (?, ?, ?, ?, ?)";
            connectionObj.query(
                sql,
                [event_id, user_name, user_email, user_phone || null, num_tickets],
                function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({
                            message: "Failed to submit registration. Please try again later."
                        });
                    }
                    res.status(201).json({
                        message: "Registration submitted successfully!",
                        registration_id: result.insertId
                    });
                }
            );
        }
    );
});

module.exports = router;
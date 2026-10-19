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
const { forecastForEvent } = require("./weather");
const { positiveId, validDate, validateEvent, queenslandToday } = require("./event-validation");

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
        "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_date >= ? AND event_availability = 'Available' ORDER BY event_date, event_time, event_id;",
        [queenslandToday()],
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
    if ((date !== undefined && !validDate(date)) ||
        (location !== undefined && (typeof location !== "string" || location.length > 150)) ||
        (category !== undefined && !positiveId(category))) {
        return res.status(400).json({ message: "Please provide a valid date, location and category filter." });
    }
    const conditions = [];
    const values = [queenslandToday()];
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
    let sql = "SELECT * FROM events JOIN categories ON events.event_category_id = categories.category_id WHERE event_availability = 'Available' AND event_date >= ?";
    if (conditions.length > 0) {
        sql = sql + " AND " + conditionSQL;
    }
    connectionObj.query(
        sql + " ORDER BY event_date, event_time, event_id",
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
    const eventId = positiveId(req.params.id);
    if (!eventId) {
        return res.status(400).json({ message: "Event ID must be a positive integer." });
    }
    connectionObj.query(
        "SELECT * FROM registrations WHERE event_id = ? ORDER BY registration_date DESC, registration_id DESC",
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
    const checked = validateEvent(req.body, false);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const { event_name, event_date, event_time, event_address, event_purpose, event_description,
        event_ticket_price, event_goal_amount, event_category_id, event_organisation_id, latitude, longitude } = checked.value;

    const sql = `INSERT INTO events (event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_goal_raised_amount, event_category_id, event_organisation_id, event_availability, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Available', ?, ?)`;

    connectionObj.query(
        sql,
        [event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_category_id, event_organisation_id, latitude ?? null, longitude ?? null],
        function (err, result) {
            if (err) {
                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(400).json({ message: "The selected category or organisation does not exist." });
                }
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
    const eventId = positiveId(req.params.id);
    if (!eventId) {
        return res.status(400).json({ message: "Event ID must be a positive integer." });
    }
    const checked = validateEvent(req.body, true);
    if (checked.error) return res.status(400).json({ message: checked.error });
    const { event_name, event_date, event_time, event_address, event_purpose, event_description,
        event_ticket_price, event_goal_amount, event_category_id, event_availability, hasCoordinates, latitude, longitude } = checked.value;

    const sql = `UPDATE events SET event_name=?, event_date=?, event_time=?, event_address=?, event_purpose=?, event_description=?, event_ticket_price=?, event_goal_amount=?, event_category_id=?, event_availability=?, latitude=IF(?, ?, latitude), longitude=IF(?, ?, longitude) WHERE event_id=?`;

    connectionObj.query(
        sql,
        [event_name, event_date, event_time, event_address, event_purpose, event_description, event_ticket_price, event_goal_amount, event_category_id, event_availability, hasCoordinates, latitude ?? null, hasCoordinates, longitude ?? null, eventId],
        function (err, result) {
            if (err) {
                if (err.code === "ER_NO_REFERENCED_ROW_2") {
                    return res.status(400).json({ message: "The selected category or organisation does not exist." });
                }
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
    const eventId = positiveId(req.params.id);
    if (!eventId) {
        return res.status(400).json({ message: "Event ID must be a positive integer." });
    }

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
                    message: `Cannot delete event. It has ${results[0].count} registration(s). An event with registrations must be kept for its attendees.`
                });
            }

            // No registrations, proceed with deletion
            connectionObj.query(
                "DELETE FROM events WHERE event_id = ?",
                [eventId],
                function (err, result) {
                    if (err) {
                        if (err.code === "ER_ROW_IS_REFERENCED_2") {
                            return res.status(400).json({ message: "This event has registrations and cannot be deleted." });
                        }
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
 * Registers a visitor for an available event after validating the request body.
 * Trims contact fields and requires a positive integer event ID and ticket count.
 * The guarded insert rechecks availability; the database's unique constraint
 * prevents duplicate registrations, including simultaneous requests.
 *
 * @param {Object} req - The request containing event and visitor details in its body.
 * @param {Object} res - The response used to send confirmation or a validation error.
 * @returns {void} Sends 201 on success, 400 for invalid or duplicate input,
 * 404 for a missing event, 409 for an unavailable event, or 500 for a database error.
 */
function createRegistration(req, res) {
    const { event_id, user_name, user_email, user_phone, num_tickets } = req.body || {};
    const eventId = ["number", "string"].includes(typeof event_id) ? Number(event_id) : NaN;
    const tickets = ["number", "string"].includes(typeof num_tickets) ? Number(num_tickets) : NaN;

    if (!Number.isSafeInteger(eventId) || eventId < 1) {
        res.status(400).json({ message: "Event ID must be a positive integer." });
        return;
    }
    if (typeof user_name !== "string" || !user_name.trim() || user_name.trim().length > 100) {
        res.status(400).json({ message: "Please enter a name between 1 and 100 characters." });
        return;
    }
    const emailPattern = /^(?=.{1,100}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (typeof user_email !== "string" || !emailPattern.test(user_email.trim())) {
        res.status(400).json({ message: "Please enter a valid email address (maximum 100 characters)." });
        return;
    }
    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 2147483647) {
        res.status(400).json({ message: "The number of tickets must be a positive whole number." });
        return;
    }
    if (user_phone != null && (typeof user_phone !== "string" || user_phone.trim().length > 20)) {
        res.status(400).json({ message: "Phone number must be at most 20 characters." });
        return;
    }

    const name = user_name.trim();
    const email = user_email.trim();
    const phone = user_phone == null ? null : user_phone.trim() || null;

    connectionObj.query(
        "SELECT event_availability, event_date < ? AS is_past FROM events WHERE event_id = ?",
        [queenslandToday(), eventId],
        function (eventError, events) {
            if (eventError) {
                console.error(eventError);
                res.status(500).json({ message: "Failed to check event availability. Please try again later." });
                return;
            }
            if (events.length === 0) {
                res.status(404).json({ message: "Event not found." });
                return;
            }
            if (events[0].event_availability !== "Available" || events[0].is_past) {
                res.status(409).json({ message: "This event is not available for registration." });
                return;
            }

            const sql = `INSERT INTO registrations (event_id, user_name, user_email, user_phone, num_tickets)
                         SELECT event_id, ?, ?, ?, ? FROM events
                         WHERE event_id = ? AND event_availability = 'Available' AND event_date >= ?`;
            connectionObj.query(
                sql,
                [name, email, phone, tickets, eventId, queenslandToday()],
                function (insertError, result) {
                    if (insertError) {
                        if (insertError.code === "ER_DUP_ENTRY") {
                            res.status(400).json({ message: "You have already registered for this event." });
                            return;
                        }
                        console.error(insertError);
                        res.status(500).json({ message: "Failed to submit registration. Please try again later." });
                        return;
                    }
                    if (result.affectedRows === 0) {
                        res.status(409).json({ message: "This event is not available for registration." });
                        return;
                    }
                    res.status(201).json({
                        message: "Registration submitted successfully!",
                        registration_id: result.insertId
                    });
                }
            );
        }
    );
}

router.post("/registrations", createRegistration);

/**
 * Retrieves an independent forecast without blocking the event details response.
 * @param {Object} req - The request containing the event ID.
 * @param {Object} res - The response used for the forecast or error message.
 * @returns {void} Sends forecast JSON, 400/404 for invalid events, or 502 on provider failure.
 */
function getEventWeather(req, res) {
    const eventId = positiveId(req.params.id);
    if (!eventId) return res.status(400).json({ message: "Event ID must be a positive integer." });
    connectionObj.query("SELECT event_date, latitude, longitude FROM events WHERE event_id = ? AND event_availability = 'Available'", [eventId],
        async function (err, events) {
            if (err) return res.status(500).json({ message: "Unable to load the event location." });
            if (!events.length) return res.status(404).json({ message: "Event not found." });
            try {
                res.json(await forecastForEvent(events[0]));
            } catch (weatherError) {
                console.error("Weather request failed:", weatherError.message);
                res.status(502).json({ message: "The weather service is temporarily unavailable. Event registration is still available." });
            }
        });
}
router.get("/events/:id/weather", getEventWeather);

module.exports = router;
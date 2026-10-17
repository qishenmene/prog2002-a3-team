/**
 * Defines the RESTful API routes for the Charity Events project.
 *
 * A3 changes:
 *   - GET  /api/events/:id          now returns the event AND its registrations
 *   - GET  /api/admin/events        all events (any status) for the admin site
 *   - GET  /api/admin/events/:id    a single event (any status) + registrations
 *   - POST/PUT/DELETE /api/events   full CRUD for the admin website
 *   - POST /api/registrations       create a registration (transactional)
 *   - GET  /api/events/:id/weather  Open-Meteo forecast proxy for the event
 *
 * @author Shixiang Tang (A2), Jihan Qu (A3 extensions)
 * @version 3.0
 * @since 2026-10-04
 * @updated 2026-10-17
 */

const express = require("express");
const eventDb = require("./event_db");

const router = express.Router();

// Promise based wrapper around the mysql2 connection. Using promises keeps the
// route handlers flat and makes multi-step operations (event + registrations,
// registration + transaction) much easier to read.
const db = eventDb.getConnection().promise();

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

const SERVER_ERROR = "Oops, something went wrong on the server. Please try again later.";

/**
 * Sends a JSON error response.
 *
 * @param {Object} res The HTTP response object.
 * @param {number} status The HTTP status code.
 * @param {string} message A user friendly error message.
 * @returns {Object} The response object.
 */
function fail(res, status, message) {
    return res.status(status).json({ message: message });
}

/**
 * Checks that a value is a positive integer.
 *
 * @param {*} value The value to check.
 * @returns {boolean} True when the value is a positive integer.
 */
function isPositiveInt(value) {
    return /^\d+$/.test(String(value)) && Number(value) > 0;
}

/**
 * Checks that a value looks like a real date in YYYY-MM-DD format.
 *
 * @param {string} value The value to check.
 * @returns {boolean} True when the value is a valid date.
 */
function isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        return false;
    }

    const date = new Date(value + "T00:00:00");

    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Checks that a value looks like a time in HH:MM or HH:MM:SS format.
 *
 * @param {string} value The value to check.
 * @returns {boolean} True when the value is a valid time.
 */
function isTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(String(value));
}

/**
 * Checks that a value is a non-negative number.
 *
 * @param {*} value The value to check.
 * @returns {boolean} True when the value is a number greater than or equal to 0.
 */
function isNonNegativeNumber(value) {
    return value !== "" && value !== null && value !== undefined &&
        !isNaN(Number(value)) && Number(value) >= 0;
}

/**
 * Loads the registrations of one event, newest purchase first.
 *
 * @param {number} eventId The event ID.
 * @returns {Promise<Array>} The list of registrations.
 */
async function getRegistrations(eventId) {
    const [rows] = await db.query(
        `SELECT registration_id, event_id, user_name, user_email, user_phone,
                num_tickets, registration_date
         FROM registrations
         WHERE event_id = ?
         ORDER BY registration_date DESC, registration_id DESC`,
        [eventId]
    );

    return rows;
}

/**
 * Loads one event with its category name, tickets sold and its registrations.
 * Used by both the client and the admin detail endpoints.
 *
 * @param {number} eventId The event ID.
 * @param {boolean} onlyAvailable When true, suspended events are treated as missing.
 * @returns {Promise<Object|null>} The event or null when it does not exist.
 */
async function getEventWithRegistrations(eventId, onlyAvailable) {
    let sql = `SELECT events.*, categories.category_name,
                      organisations.organisation_name,
                      (SELECT COALESCE(SUM(r.num_tickets), 0)
                       FROM registrations r
                       WHERE r.event_id = events.event_id) AS tickets_sold
               FROM events
               JOIN categories ON events.event_category_id = categories.category_id
               JOIN organisations ON events.event_organisation_id = organisations.organisation_id
               WHERE events.event_id = ?`;

    if (onlyAvailable) {
        sql += " AND events.event_availability = 'Available'";
    }

    const [rows] = await db.query(sql, [eventId]);

    if (rows.length === 0) {
        return null;
    }

    const event = rows[0];
    event.registrations = await getRegistrations(eventId);

    return event;
}

/* ------------------------------------------------------------------ *
 * Weather (Open-Meteo external API)
 * ------------------------------------------------------------------ */

// The Open-Meteo service is free and does not require an API key. The call is
// made from the server so the browser never talks to a third party directly
// and so repeated page views are served from a short lived cache.
const WEATHER_CACHE_MS = 10 * 60 * 1000;
const weatherCache = new Map();

/**
 * Translates a WMO weather code into a readable description.
 * The codes used here are the ones listed in the assessment brief.
 *
 * @param {number} code The WMO weather code returned by Open-Meteo.
 * @returns {string} A human readable description.
 */
function describeWeatherCode(code) {
    const descriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Light rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Light snow",
        73: "Moderate snow",
        75: "Heavy snow",
        77: "Snow grains",
        80: "Light rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Light snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };

    return descriptions[code] || "Unknown conditions";
}

/**
 * Picks a short icon name for a weather code so the website can render a
 * simple CSS symbol without downloading images.
 *
 * @param {number} code The WMO weather code.
 * @returns {string} One of: sun, cloud, fog, rain, snow, storm.
 */
function weatherIcon(code) {
    if (code === 0 || code === 1) {
        return "sun";
    }
    if (code === 2 || code === 3) {
        return "cloud";
    }
    if (code === 45 || code === 48) {
        return "fog";
    }
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].indexOf(code) !== -1) {
        return "rain";
    }
    if ([71, 73, 75, 77, 85, 86].indexOf(code) !== -1) {
        return "snow";
    }

    return "storm";
}

/**
 * Calls Open-Meteo for a coordinate pair and returns a normalised forecast.
 *
 * @param {number} latitude The latitude of the event location.
 * @param {number} longitude The longitude of the event location.
 * @returns {Promise<Object>} The forecast data.
 */
async function fetchForecast(latitude, longitude) {
    const url = "https://api.open-meteo.com/v1/forecast"
        + "?latitude=" + encodeURIComponent(latitude)
        + "&longitude=" + encodeURIComponent(longitude)
        + "&daily=weather_code,temperature_2m_max,temperature_2m_min"
        + "&forecast_days=3"
        + "&timezone=" + encodeURIComponent(process.env.WEATHER_TIMEZONE || "Australia/Brisbane");

    const controller = new AbortController();
    const timer = setTimeout(function () {
        controller.abort();
    }, 8000);

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error("Open-Meteo responded with status " + response.status);
        }

        const data = await response.json();
        const daily = data.daily || {};
        const days = [];

        for (let i = 0; i < (daily.time || []).length; i++) {
            const code = daily.weather_code[i];

            days.push({
                date: daily.time[i],
                weather_code: code,
                description: describeWeatherCode(code),
                icon: weatherIcon(code),
                temperature_max: daily.temperature_2m_max[i],
                temperature_min: daily.temperature_2m_min[i]
            });
        }

        return {
            latitude: Number(latitude),
            longitude: Number(longitude),
            timezone: data.timezone || null,
            days: days,
            source: "Open-Meteo (https://api.open-meteo.com)"
        };
    } finally {
        clearTimeout(timer);
    }
}

/* ------------------------------------------------------------------ *
 * Client-side endpoints
 * ------------------------------------------------------------------ */

/**
 * GET /api/events
 * Returns every upcoming, available event for the home page.
 */
router.get("/events", async function (req, res) {
    try {
        const [rows] = await db.query(
            `SELECT events.*, categories.category_name,
                    (SELECT COALESCE(SUM(r.num_tickets), 0)
                     FROM registrations r
                     WHERE r.event_id = events.event_id) AS tickets_sold
             FROM events
             JOIN categories ON events.event_category_id = categories.category_id
             WHERE events.event_date >= CURDATE()
               AND events.event_availability = 'Available'
             ORDER BY events.event_date ASC`
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * GET /api/categories
 * Returns all event categories (used by the search filter and admin forms).
 */
router.get("/categories", async function (req, res) {
    try {
        const [rows] = await db.query(
            "SELECT * FROM categories ORDER BY category_name"
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * GET /api/events/search?date=&location=&category=
 * Filters available events. Every filter is optional.
 */
router.get("/events/search", async function (req, res) {
    const date = req.query.date;
    const location = req.query.location;
    const category = req.query.category;
    const conditions = [];
    const values = [];

    if (date) {
        if (!isDate(date)) {
            return fail(res, 400, "The date filter must use the YYYY-MM-DD format.");
        }

        conditions.push("events.event_date = ?");
        values.push(date);
    }

    if (location) {
        conditions.push("events.event_address LIKE ?");
        values.push("%" + location + "%");
    }

    if (category) {
        if (!isPositiveInt(category)) {
            return fail(res, 400, "The category filter must be a valid category ID.");
        }

        conditions.push("events.event_category_id = ?");
        values.push(category);
    }

    let sql = `SELECT events.*, categories.category_name,
                      (SELECT COALESCE(SUM(r.num_tickets), 0)
                       FROM registrations r
                       WHERE r.event_id = events.event_id) AS tickets_sold
               FROM events
               JOIN categories ON events.event_category_id = categories.category_id
               WHERE events.event_availability = 'Available'`;

    if (conditions.length > 0) {
        sql += " AND " + conditions.join(" AND ");
    }

    sql += " ORDER BY events.event_date ASC";

    try {
        const [rows] = await db.query(sql, values);
        res.json(rows);
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * GET /api/events/:id
 * Returns a single available event together with the complete list of its
 * registrations (newest first). This is the enhanced endpoint required by
 * Part 2 of the assessment.
 */
router.get("/events/:id", async function (req, res) {
    if (!isPositiveInt(req.params.id)) {
        return fail(res, 400, "The event ID must be a positive integer.");
    }

    try {
        const event = await getEventWithRegistrations(req.params.id, true);

        if (!event) {
            return fail(res, 404, "Event not found.");
        }

        res.json(event);
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * GET /api/events/:id/registrations
 * Returns the registrations of one event, latest purchase first.
 */
router.get("/events/:id/registrations", async function (req, res) {
    if (!isPositiveInt(req.params.id)) {
        return fail(res, 400, "The event ID must be a positive integer.");
    }

    try {
        res.json(await getRegistrations(req.params.id));
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * GET /api/events/:id/weather
 * Returns a three day Open-Meteo forecast for the event location.
 */
router.get("/events/:id/weather", async function (req, res) {
    if (!isPositiveInt(req.params.id)) {
        return fail(res, 400, "The event ID must be a positive integer.");
    }

    try {
        const [rows] = await db.query(
            `SELECT event_id, event_name, event_address, latitude, longitude
             FROM events WHERE event_id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return fail(res, 404, "Event not found.");
        }

        const event = rows[0];

        if (event.latitude === null || event.longitude === null) {
            return fail(res, 404, "No coordinates are stored for this event location.");
        }

        const cacheKey = event.latitude + "," + event.longitude;
        const cached = weatherCache.get(cacheKey);

        if (cached && Date.now() - cached.storedAt < WEATHER_CACHE_MS) {
            return res.json(Object.assign({}, cached.data, { cached: true }));
        }

        const forecast = await fetchForecast(event.latitude, event.longitude);
        forecast.location = event.event_address;
        forecast.cached = false;

        weatherCache.set(cacheKey, { storedAt: Date.now(), data: forecast });

        res.json(forecast);
    } catch (err) {
        console.error(err);
        fail(res, 502, "The weather service is currently unavailable. Please try again later.");
    }
});

/**
 * POST /api/registrations
 * Creates a registration and adds the ticket revenue to the event total.
 * The two writes run inside a transaction so a partial update cannot happen.
 */
router.post("/registrations", async function (req, res) {
    const body = req.body || {};
    const eventId = body.event_id;
    const userName = String(body.user_name || "").trim();
    const userEmail = String(body.user_email || "").trim().toLowerCase();
    const userPhone = String(body.user_phone || "").trim();
    const numTickets = body.num_tickets;

    const errors = [];

    if (!isPositiveInt(eventId)) {
        errors.push("A valid event is required.");
    }

    if (userName.length < 2 || userName.length > 100) {
        errors.push("The full name must be between 2 and 100 characters.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(userEmail) || userEmail.length > 100) {
        errors.push("Please provide a valid email address.");
    }

    if (userPhone && !/^[0-9 +()-]{6,20}$/.test(userPhone)) {
        errors.push("The phone number may only contain digits, spaces and + ( ) -.");
    }

    if (!isPositiveInt(numTickets) || Number(numTickets) > 10) {
        errors.push("The number of tickets must be a whole number between 1 and 10.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0], errors: errors });
    }

    let connection;

    try {
        connection = await db.getConnection();

        const [eventRows] = await connection.query(
            `SELECT event_id, event_ticket_price, event_availability, event_date
             FROM events WHERE event_id = ?`,
            [eventId]
        );

        if (eventRows.length === 0) {
            connection.release();
            return fail(res, 404, "Event not found.");
        }

        const event = eventRows[0];

        if (event.event_availability !== "Available") {
            connection.release();
            return fail(res, 400, "This event is not currently accepting registrations.");
        }

        const [duplicates] = await connection.query(
            "SELECT registration_id FROM registrations WHERE event_id = ? AND user_email = ?",
            [eventId, userEmail]
        );

        if (duplicates.length > 0) {
            connection.release();
            return fail(res, 409, "This email has already registered for this event.");
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO registrations
                (event_id, user_name, user_email, user_phone, num_tickets, registration_date)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [eventId, userName, userEmail, userPhone || null, Number(numTickets)]
        );

        const revenue = Number(event.event_ticket_price) * Number(numTickets);

        if (revenue > 0) {
            await connection.query(
                `UPDATE events
                 SET event_goal_raised_amount = event_goal_raised_amount + ?
                 WHERE event_id = ?`,
                [revenue, eventId]
            );
        }

        await connection.commit();
        connection.release();

        res.status(201).json({
            message: "Registration submitted successfully!",
            registration_id: result.insertId,
            tickets: Number(numTickets),
            revenue_added: revenue
        });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(rollbackError);
            }

            connection.release();
        }

        if (err.code === "ER_DUP_ENTRY") {
            return fail(res, 409, "This email has already registered for this event.");
        }

        console.error(err);
        fail(res, 500, "Failed to submit registration. Please try again later.");
    }
});

/* ------------------------------------------------------------------ *
 * Admin-side endpoints
 * ------------------------------------------------------------------ */

/**
 * GET /api/admin/events
 * Returns every event regardless of date or availability, including how many
 * registrations and tickets it has. This is the admin dashboard list.
 */
router.get("/admin/events", async function (req, res) {
    try {
        const [rows] = await db.query(
            `SELECT events.*, categories.category_name,
                    organisations.organisation_name,
                    (SELECT COUNT(*) FROM registrations r
                     WHERE r.event_id = events.event_id) AS registration_count,
                    (SELECT COALESCE(SUM(r.num_tickets), 0) FROM registrations r
                     WHERE r.event_id = events.event_id) AS tickets_sold
             FROM events
             JOIN categories ON events.event_category_id = categories.category_id
             JOIN organisations ON events.event_organisation_id = organisations.organisation_id
             ORDER BY events.event_date DESC, events.event_id DESC`
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * GET /api/admin/events/:id
 * Returns any event (including suspended or past events) with its
 * registrations so the admin edit form can show them.
 */
router.get("/admin/events/:id", async function (req, res) {
    if (!isPositiveInt(req.params.id)) {
        return fail(res, 400, "The event ID must be a positive integer.");
    }

    try {
        const event = await getEventWithRegistrations(req.params.id, false);

        if (!event) {
            return fail(res, 404, "Event not found.");
        }

        res.json(event);
    } catch (err) {
        console.error(err);
        fail(res, 500, SERVER_ERROR);
    }
});

/**
 * POST /api/events
 * Creates a new charity event for the admin website.
 */
router.post("/events", async function (req, res) {
    const body = req.body || {};
    const name = String(body.event_name || "").trim();
    const date = body.event_date;
    const time = body.event_time;
    const address = String(body.event_address || "").trim();
    const purpose = String(body.event_purpose || "").trim();
    const description = String(body.event_description || "").trim();
    const price = body.event_ticket_price;
    const goal = body.event_goal_amount;
    const categoryId = body.event_category_id;
    const organisationId = body.event_organisation_id || 1;
    const latitude = body.latitude === undefined || body.latitude === "" ? null : Number(body.latitude);
    const longitude = body.longitude === undefined || body.longitude === "" ? null : Number(body.longitude);

    const errors = [];

    if (name.length < 3 || name.length > 100) {
        errors.push("The event name must be between 3 and 100 characters.");
    }
    if (!isDate(date)) {
        errors.push("A valid event date is required.");
    }
    if (!isTime(time)) {
        errors.push("A valid event time is required.");
    }
    if (address.length < 5 || address.length > 150) {
        errors.push("A valid event address is required.");
    }
    if (purpose.length > 150) {
        errors.push("The purpose cannot be longer than 150 characters.");
    }
    if (description.length > 500) {
        errors.push("The description cannot be longer than 500 characters.");
    }
    if (!isNonNegativeNumber(price)) {
        errors.push("The ticket price must be zero or more.");
    }
    if (!isNonNegativeNumber(goal)) {
        errors.push("The goal amount must be zero or more.");
    }
    if (!isPositiveInt(categoryId)) {
        errors.push("Please select a category.");
    }
    if (!isPositiveInt(organisationId)) {
        errors.push("Please select an organisation.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0], errors: errors });
    }

    try {
        const [categories] = await db.query(
            "SELECT category_id FROM categories WHERE category_id = ?",
            [categoryId]
        );

        if (categories.length === 0) {
            return fail(res, 400, "The selected category does not exist.");
        }

        const [result] = await db.query(
            `INSERT INTO events
                (event_name, event_date, event_time, event_address, event_purpose,
                 event_description, event_ticket_price, event_goal_amount,
                 event_goal_raised_amount, event_category_id, event_organisation_id,
                 event_availability, latitude, longitude)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'Available', ?, ?)`,
            [name, date, time, address, purpose, description,
                Number(price), Number(goal), Number(categoryId), Number(organisationId),
                latitude, longitude]
        );

        const [rows] = await db.query(
            "SELECT * FROM events WHERE event_id = ?",
            [result.insertId]
        );

        res.status(201).json({
            message: "Event created successfully.",
            event: rows[0]
        });
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to create the event. Please check your input and try again.");
    }
});

/**
 * PUT /api/events/:id
 * Updates every editable field of an existing event.
 */
router.put("/events/:id", async function (req, res) {
    if (!isPositiveInt(req.params.id)) {
        return fail(res, 400, "The event ID must be a positive integer.");
    }

    const body = req.body || {};
    const name = String(body.event_name || "").trim();
    const date = body.event_date;
    const time = body.event_time;
    const address = String(body.event_address || "").trim();
    const purpose = String(body.event_purpose || "").trim();
    const description = String(body.event_description || "").trim();
    const price = body.event_ticket_price;
    const goal = body.event_goal_amount;
    const categoryId = body.event_category_id;
    const availability = body.event_availability || "Available";
    const latitude = body.latitude === undefined || body.latitude === "" ? null : Number(body.latitude);
    const longitude = body.longitude === undefined || body.longitude === "" ? null : Number(body.longitude);

    const errors = [];

    if (name.length < 3 || name.length > 100) {
        errors.push("The event name must be between 3 and 100 characters.");
    }
    if (!isDate(date)) {
        errors.push("A valid event date is required.");
    }
    if (!isTime(time)) {
        errors.push("A valid event time is required.");
    }
    if (address.length < 5 || address.length > 150) {
        errors.push("A valid event address is required.");
    }
    if (purpose.length > 150) {
        errors.push("The purpose cannot be longer than 150 characters.");
    }
    if (description.length > 500) {
        errors.push("The description cannot be longer than 500 characters.");
    }
    if (!isNonNegativeNumber(price)) {
        errors.push("The ticket price must be zero or more.");
    }
    if (!isNonNegativeNumber(goal)) {
        errors.push("The goal amount must be zero or more.");
    }
    if (!isPositiveInt(categoryId)) {
        errors.push("Please select a category.");
    }
    if (["Available", "Suspended", "Past"].indexOf(availability) === -1) {
        errors.push("The availability must be Available, Suspended or Past.");
    }

    if (errors.length > 0) {
        return res.status(400).json({ message: errors[0], errors: errors });
    }

    try {
        const [result] = await db.query(
            `UPDATE events
             SET event_name = ?, event_date = ?, event_time = ?, event_address = ?,
                 event_purpose = ?, event_description = ?, event_ticket_price = ?,
                 event_goal_amount = ?, event_category_id = ?, event_availability = ?,
                 latitude = ?, longitude = ?
             WHERE event_id = ?`,
            [name, date, time, address, purpose, description, Number(price),
                Number(goal), Number(categoryId), availability, latitude, longitude,
                req.params.id]
        );

        if (result.affectedRows === 0) {
            return fail(res, 404, "Event not found.");
        }

        const [rows] = await db.query(
            "SELECT * FROM events WHERE event_id = ?",
            [req.params.id]
        );

        res.json({
            message: "Event updated successfully.",
            event: rows[0]
        });
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to update the event. Please try again later.");
    }
});

/**
 * DELETE /api/events/:id
 * Deletes an event only when it has no registrations, which protects the
 * integrity of the registration data (Part 2 requirement).
 */
router.delete("/events/:id", async function (req, res) {
    if (!isPositiveInt(req.params.id)) {
        return fail(res, 400, "The event ID must be a positive integer.");
    }

    try {
        const [registrations] = await db.query(
            "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?",
            [req.params.id]
        );

        const count = registrations[0].count;

        if (count > 0) {
            return res.status(409).json({
                message: "This event cannot be deleted because it has "
                    + count + " registration(s). Suspend the event instead.",
                registration_count: count
            });
        }

        const [result] = await db.query(
            "DELETE FROM events WHERE event_id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return fail(res, 404, "Event not found.");
        }

        res.json({ message: "Event deleted successfully." });
    } catch (err) {
        console.error(err);
        fail(res, 500, "Failed to delete the event. Please try again later.");
    }
});

/**
 * GET /api/health
 * Small endpoint used to confirm that the API and the database are reachable
 * after the website has been deployed to cPanel.
 */
router.get("/health", async function (req, res) {
    try {
        await db.query("SELECT 1");

        res.json({
            status: "ok",
            database: "connected",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", database: "unavailable" });
    }
});

module.exports = router;

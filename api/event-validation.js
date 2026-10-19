/**
 * Validates event input before it reaches MySQL.
 * Field limits follow database/charityevents_db.sql.
 */

/**
 * @typedef {Object} EventValidationResult
 * @property {Object} [value] - Normalised fields when validation succeeds.
 * @property {string} [error] - The first validation message for invalid input.
 */

/**
 * Reads today's calendar date in Queensland, where the events take place.
 * @returns {string} The current Brisbane date in YYYY-MM-DD format.
 */
function queenslandToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Australia/Brisbane", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    return part("year") + "-" + part("month") + "-" + part("day");
}

/**
 * Converts a decimal ID to a positive safe integer.
 * @param {unknown} value - A request parameter or foreign key.
 * @returns {number|null} The ID, or null for invalid input.
 */
function positiveId(value) {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (!/^\d+$/.test(String(value))) return null;
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Checks a calendar date without converting it to another time zone.
 * @param {unknown} value - A date in YYYY-MM-DD format.
 * @returns {boolean} Whether the date exists and fits the MySQL DATE range.
 */
function validDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return year >= 1000 && date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Checks and normalises a complete create or update payload.
 * @param {unknown} body - The JSON request body.
 * @param {boolean} editing - Whether an availability value is required.
 * @returns {EventValidationResult} Normalised fields or a validation message.
 */
function validateEvent(body, editing) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Please provide an event as a JSON object." };
    }
    const value = {};
    const lengths = { event_name: 100, event_address: 150, event_purpose: 150, event_description: 500 };
    for (const [field, limit] of Object.entries(lengths)) {
        if (typeof body[field] !== "string" || !body[field].trim() || body[field].trim().length > limit) {
            return { error: field.replaceAll("_", " ") + " must contain 1 to " + limit + " characters." };
        }
        value[field] = body[field].trim();
    }
    if (!validDate(body.event_date)) return { error: "Please enter a valid event date (YYYY-MM-DD)." };
    if (typeof body.event_time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(body.event_time)) {
        return { error: "Please enter a valid event time (HH:MM)." };
    }
    value.event_date = body.event_date;
    value.event_time = body.event_time;
    for (const field of ["event_ticket_price", "event_goal_amount"]) {
        const raw = body[field];
        const amount = typeof raw === "number" || (typeof raw === "string" && raw.trim()) ? Number(raw) : NaN;
        if (!Number.isFinite(amount) || amount < 0 || amount > 99999999.99 ||
            Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
            return { error: field.replaceAll("_", " ") + " must be between 0 and 99,999,999.99, with at most two decimal places." };
        }
        value[field] = amount;
    }
    value.event_category_id = positiveId(body.event_category_id);
    value.event_organisation_id = positiveId(body.event_organisation_id === undefined ? 1 : body.event_organisation_id);
    if (!value.event_category_id || !value.event_organisation_id) {
        return { error: "Please select a valid category and organisation." };
    }
    value.event_availability = editing ? body.event_availability : "Available";
    if (!["Available", "Suspended"].includes(value.event_availability)) {
        return { error: "Availability must be Available or Suspended." };
    }
    value.hasCoordinates = Object.hasOwn(body, "latitude") || Object.hasOwn(body, "longitude");
    if (value.hasCoordinates) {
        const blank = input => input == null || input === "";
        if (blank(body.latitude) !== blank(body.longitude)) return { error: "Provide both latitude and longitude, or leave both blank." };
        if (blank(body.latitude)) { value.latitude = null; value.longitude = null; }
        else {
            for (const [field, limit] of [["latitude", 90], ["longitude", 180]]) {
                const raw = body[field];
                const coordinate = typeof raw === "number" || (typeof raw === "string" && raw.trim()) ? Number(raw) : NaN;
                if (!Number.isFinite(coordinate) || Math.abs(coordinate) > limit) return { error: "Please enter a valid " + field + "." };
                value[field] = Math.round(coordinate * 1000000) / 1000000;
            }
        }
    }
    return { value };
}

module.exports = { positiveId, validDate, validateEvent, queenslandToday };

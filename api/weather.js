/**
 * Retrieves an event-date forecast from Open-Meteo.
 * Reference: https://open-meteo.com/en/docs
 */
const descriptions = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Light freezing drizzle", 57: "Dense freezing drizzle", 61: "Light rain", 63: "Moderate rain",
    65: "Heavy rain", 66: "Light freezing rain", 67: "Heavy freezing rain", 71: "Light snow",
    73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains", 80: "Light rain showers",
    81: "Moderate rain showers", 82: "Heavy rain showers", 85: "Light snow showers",
    86: "Heavy snow showers", 95: "Thunderstorm", 96: "Thunderstorm with hail",
    97: "Heavy thunderstorm", 99: "Thunderstorm with heavy hail"
};

/**
 * Fetches the forecast for the event's date, rather than today's weather.
 * All case-study events take place in Queensland, which uses Brisbane time.
 * @param {Object} event - The stored date and coordinates of the event.
 * @param {Function} request - The HTTP client; defaults to the Node.js fetch API.
 * @returns {Promise<Object>} A forecast or an explanation when it is unavailable.
 */
async function forecastForEvent(event, request = fetch) {
    const date = event.event_date.slice(0, 10);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Brisbane", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type).value;
    const today = part("year") + "-" + part("month") + "-" + part("day");
    const daysAway = (Date.parse(date) - Date.parse(today)) / 86400000;
    const unavailable = message => ({ state: "unavailable", date, message });
    if (daysAway < 0) return unavailable("This event has already taken place.");
    if (daysAway > 15) return unavailable("The forecast is available within 16 days of the event. Please check again closer to the date.");
    if (event.latitude == null || event.longitude == null) return unavailable("A forecast will be available once the organiser adds the event coordinates.");
    const latitude = Number(event.latitude), longitude = Number(event.longitude);
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) {
        return unavailable("The event location needs valid coordinates before a forecast can be shown.");
    }
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({ latitude, longitude, daily: "weather_code,temperature_2m_max,temperature_2m_min",
        timezone: "Australia/Brisbane", start_date: date, end_date: date }).toString();
    const response = await request(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error("Weather provider returned HTTP " + response.status);
    const data = await response.json();
    const index = data.daily?.time?.indexOf(date) ?? -1;
    const low = data.daily?.temperature_2m_min?.[index];
    const high = data.daily?.temperature_2m_max?.[index];
    const code = data.daily?.weather_code?.[index];
    if (index < 0 || !Number.isFinite(low) || !Number.isFinite(high) || !Number.isInteger(code)) {
        return unavailable("The weather provider has not supplied a complete forecast for this event date yet.");
    }
    return { state: "available", date, low, high, description: descriptions[code] || "Weather conditions unavailable",
        timezone: "Australia/Brisbane", source: "Open-Meteo" };
}

module.exports = { forecastForEvent };

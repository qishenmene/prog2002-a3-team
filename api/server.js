/**
 * Creates and runs the Express server for the Charity Events project.
 *
 * The server exposes three things:
 *   1. /api    - the RESTful API (see api-controller.js)
 *   2. /admin  - the Angular admin-side website (built output)
 *   3. /       - the Angular client-side website (built output), falling back
 *                to the legacy "clientside" pages from Assessment 2.
 *
 * @author Shixiang Tang (A2), Jihan Qu (A3)
 * @version 2.0
 * @since 2026-10-01
 * @updated 2026-10-17
 */

const express = require("express");
const path = require("path");
const fs = require("fs");
const api = require("./api-controller");

const app = express();
// cPanel Passenger assigns the port via process.env.PORT; 8080 for local dev.
const port = process.env.PORT || 8080;

/* ------------------------------------------------------------------ *
 * Middleware
 * ------------------------------------------------------------------ */

// Body parser: required so that POST / PUT requests can read JSON data.
app.use(express.json({ limit: "100kb" }));

/**
 * Minimal CORS layer. The Angular dev servers run on different ports
 * (4200 / 4300) during development, so the browser sends pre-flight
 * requests. In production both websites are served from the same origin
 * and this middleware is simply a no-op.
 */
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
    "http://localhost:4200,http://localhost:4300")
    .split(",")
    .map(function (origin) {
        return origin.trim();
    });

app.use(function (req, res, next) {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.indexOf(origin) !== -1) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// Small request logger - useful when demonstrating the API in the video.
app.use(function (req, res, next) {
    console.log(req.method + " " + req.originalUrl);
    next();
});

/* ------------------------------------------------------------------ *
 * API
 * ------------------------------------------------------------------ */

app.use("/api", api);

/* ------------------------------------------------------------------ *
 * Static websites
 * ------------------------------------------------------------------ */

const clientDist = path.join(__dirname, "../client-app/dist/client-app/browser");
const adminDist = path.join(__dirname, "../admin-app/dist/admin-app/browser");
const legacyClient = path.join(__dirname, "../clientside");

const clientRoot = fs.existsSync(clientDist) ? clientDist : legacyClient;

// The admin website is mounted on /admin so both websites live on one host.
app.use("/admin", express.static(adminDist));
app.use(express.static(clientRoot));

// Deep links into the admin app (e.g. /admin/edit/2) return the admin shell.
app.get(/^\/admin(\/.*)?$/, function (req, res, next) {
    const adminIndex = path.join(adminDist, "index.html");
    if (fs.existsSync(adminIndex)) {
        return res.sendFile(adminIndex);
    }
    next();
});

// Any other GET request that is not an API call returns the client app so the
// Angular router can handle deep links such as /event/3.
app.get(/^\/(?!api).*/, function (req, res, next) {
    const indexFile = path.join(clientRoot, "index.html");

    if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
    }

    next();
});

/* ------------------------------------------------------------------ *
 * Error handling
 * ------------------------------------------------------------------ */

// Unknown API route -> JSON 404 instead of an HTML page.
app.use("/api", function (req, res) {
    res.status(404).json({
        message: "API endpoint not found: " + req.method + " " + req.originalUrl
    });
});

// Central error handler so an unexpected exception never crashes the app.
app.use(function (err, req, res, next) {
    console.error(err);
    res.status(500).json({
        message: "Oops, something went wrong on the server. Please try again later."
    });
});

app.listen(port, function () {
    console.log("Server is running on port " + port);
    console.log("Client website:  http://localhost:" + port + "/");
    console.log("Admin website:   http://localhost:" + port + "/admin/");
    console.log("API:             http://localhost:" + port + "/api/events");
});

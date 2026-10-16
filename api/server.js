/**
 * Creates and runs the Express server for the Charity Events project.
 *
 * @author Shixiang Tang
 * @version 1.0
 * @since 2026-10-01
 */

const express = require("express");
const api = require("./api-controller");
const path = require("path");

const app = express();
const port = 8080;

app.use("/api", api);

app.use(
    express.static(
        path.join(__dirname, "../clientside")
    )
);

app.get("/", function (req, res) {
    res.sendFile(
        path.join(
            __dirname,
            "../clientside/index.html"
        )
    );
});

app.listen(
    port,
    function () {
        console.log("Server is running on port " + port);
    }
);
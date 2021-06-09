const express = require("express");
const morgan = require("morgan");
const cors = require('cors');

const Routes = require("./routes");


// Port der API festlegen
const port = 5000;

const app = express();
app.use(cors());
if (process.env.M_PROD === "true") {
    app.use(morgan("short")); // configire morgan
} else {
    app.use(morgan("dev")); // configire morgan
}
app.use(express.json());
// Routen einbinden aus ./routes.js
Routes(app);

app.listen(port, () => {
    console.log("Server wurde gestartet! Läuft auf Port", port);
});
    
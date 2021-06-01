const express = require("express");
const morgan = require("morgan");
const cors = require('cors');
const dotenv = require('dotenv');

// Environment laden aus .env
dotenv.config();

const Keycloak = require('keycloak-connect');
var keycloak = new Keycloak({}, {
    "realm": process.env.KC_REALM,
    "bearer-only": true,
    "auth-server-url": process.env.KC_AUTH_SERVER_URL,
    "ssl-required": "external",
    "resource": process.env.KC_CLIENT
});
const Routes = require("./routes");


// Port der API festlegen
const port = 5000;

const app = express();
app.use(cors());
app.use(keycloak.middleware());
if (process.env.M_PROD === "true") {
    app.use(morgan("short")); // configire morgan
} else {
    app.use(morgan("dev")); // configire morgan
}
app.use(express.json());
// Routen einbinden aus ./routes.js
Routes(app, keycloak);

app.listen(port, () => {
    console.log("Server wurde gestartet! Läuft auf Port", port);
});
    
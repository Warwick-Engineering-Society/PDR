const express = require("express");
const app = express();
const fetch = require("node-fetch");

app.get("/", async (req, res) => {
    if (req.isAuthenticated()) {
        console.log(req.user);
        res.render("index.ejs", {
            id: req.user.UniversityIDUnscoped,
            name: req.user["urn:oid:2.5.4.42"],
            buttonValue: "Log out",
            buttonLink: "saml/logout",
        });
    } else {
        res.render("index.ejs", {
            id: "0",
            name: "Stranger",
            buttonValue: "Login",
            buttonLink: "saml/login",
        });
    }
});

app.get("/events", async (req, res) => {
    const response = await fetch(
        "https://warwick-engineering-society.github.io/engsoc-events/data.json"
    );
    const data = await response.json();
    return res.send(data);
});

module.exports = app;

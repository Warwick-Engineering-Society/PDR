const express = require("express");
const app = express();
const fetch = require("node-fetch");

app.post("/points", async (req, res) => {
    if (req.isAuthenticated()) {
        let url = `${process.env.ENGSOC_SERVER}/pdr_app/?pw=${process.env.ENGSOC_SERVER_SECRET}&id=${req.user.UniversityIDUnscoped}`;
        let data = fetch(url).then(res => res.json());
        return res.send((await data).toString());
    } else {
        return res.status(401).end(`Please login`);
    }
});

app.post("/moreInfo", async (req, res) => {
    if (req.isAuthenticated()) {
        let url = `${process.env.ENGSOC_SERVER}/pdr_app/moreinfo.php?pw=${process.env.ENGSOC_SERVER_SECRET}&id=${req.user.UniversityIDUnscoped}`;
        let data = fetch(url).then(res => res.text());
        return res.status(200).send((await data).toString());
    } else {
        return res.status(401).end(`User is not logged in. Please login`);
    }
});

module.exports = app;

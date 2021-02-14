const express = require("express");
const app = express();
const fs = require("fs");
const passport = require("passport");
const bodyParser = require("body-parser");
const saml = require("passport-saml").Strategy;

let options = {
    serverName: process.env.SERVER_NAME,
    appName: process.env.APP_NAME,
    issuer: "https://" + process.env.SERVER_NAME + "/",
    callbackUrl: "https://" + process.env.SERVER_NAME + "/saml/consume",
};

if (process.env.MODE == "TEST") {
    options.certFile = "./idp-testSigning.crt";
    options.entryPoint = "https://idp-test.warwick.ac.uk/idp/profile/SAML2/Redirect/SSO";
    options.logoutUrl = "https://idp-test.warwick.ac.uk/idp/profile/Logout";
} else {
    options.certFile = "./idpSigning.crt";
    options.entryPoint = "https://idp.warwick.ac.uk/idp/profile/SAML2/Redirect/SSO";
    options.logoutUrl = "https://idp.warwick.ac.uk/idp/profile/Logout";
}
const signingCert = fs.readFileSync(options.certFile, "utf-8");

const strategy = new saml(
    {
        entryPoint: options.entryPoint,
        issuer: options.appName,
        protocol: "https://",
        logoutUrl: options.logoutUrl,
        issuer: options.issuer,
        cert: signingCert,
        host: options.serverName,
        callbackUrl: options.callbackUrl,
        identifierFormat: null,
        validateInResponseTo: false,
        disableRequestedAuthnContext: true,
    },
    function (profile, done) {
        return done(null, profile);
    }
);

// register the strategy with passport
passport.use(strategy);

app.get(
    "/login",
    passport.authenticate("saml", { failureRedirect: "/saml/fail" }),
    function (req, res) {
        res.redirect("/");
    }
);

app.post(
    "/consume",
    bodyParser.urlencoded({ extended: false }),
    passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
    function (req, res) {
        let today = new Date();
        let date = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        console.log("=========================================================");
        console.log(date + " " + time);
        res.redirect("/");
    }
);

app.get("/loggedIn", async (req, res) => {
    if (req.isAuthenticated()) {
        return res.status(200).send(true);
    } else {
        return res.status(200).send(false);
    }
});

app.get("/saml/fail", function (req, res) {
    res.status(401).send("Login failed");
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

app.get("/Shibboleth.sso/Metadata", function (req, res) {
    res.type("application/xml");
    res.status(200).send(strategy.generateServiceProviderMetadata());
});

module.exports = app;

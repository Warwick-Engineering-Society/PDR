const { response } = require("express");
const express = require("express");
const fs = require("fs");
const app = express();

var passport = require("passport");
var saml = require("passport-saml").Strategy;
var decryptionCert = fs.readFileSync("./certificate.crt", "utf-8");

// saml strategy for passport
var strategy = new saml(
  {
    entryPoint: "https://idp-test.warwick.ac.uk/idp/profile/SAML2/Redirect/SSO",
    issuer: "Warwick Engineering Society PDR",
    protocol: "https://",
    logoutUrl: "https://idp-test.warwick.ac.uk/idp/profile/SAML2/Redirect/SSO",
    issuer: "https://pdr.engsoc.uk/",
    cert: decryptionCert,
    host: "pdr.engsoc.uk"
  },
  (profile, done) => {
    findByEmail(profile.email, function (err, user) {
      if (err) {
        return done(err);
      }
      return done(null, user);
    });
  }
);

// register the strategy with passport
passport.use(strategy);

app.set("view-engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use('/pwa-install-prompt', express.static(__dirname + '/node_modules/pwa-install-prompt/'));

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("index.ejs", { profile });
  } else {
    res.redirect("/login");
  }
});

app.post(
  "/login/callback",
  passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
  function (req, res) {
    res.redirect("/");
  }
);
app.get(
  "/login",
  passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
  function (req, res) {
    res.redirect("/");
  }
);

console.log(strategy.generateServiceProviderMetadata(decryptionCert));

const listener = app.listen(42056, function() {
  console.log("Listening on port " + listener.address().port);
});

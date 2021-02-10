const { response } = require("express");
const path = require("path");
const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var passport = require("passport");
var saml = require("passport-saml").Strategy;
const signingCert = fs.readFileSync("./idpSigning.crt", "utf-8");


passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

var strategy = new saml(
  {
    entryPoint: "https://idp-test.warwick.ac.uk/idp/profile/SAML2/Redirect/SSO",
    issuer: "Warwick Engineering Society PDR",
    protocol: "https://",
    logoutUrl: "https://idp-test.warwick.ac.uk/idp/profile/Logout",
    issuer: "https://pdr.engsoc.uk/",
    cert: signingCert,
    host: "pdr.engsoc.uk",
    callbackUrl: "https://pdr.engsoc.uk/saml/consume",
    identifierFormat: null,
    validateInResponseTo: false,
    disableRequestedAuthnContext: true
  },
  function (profile, done) {
    return done(null, profile);
  }
);

// register the strategy with passport
passport.use(strategy);

const app = express();

app.use(cookieParser());
app.use(bodyParser());
app.use(session({ secret: "my super secret secret" }));
app.use(passport.initialize());
app.use(passport.session());

app.set("view-engine", "ejs");


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  else
    return res.redirect('/login');
}

app.get('/',
  ensureAuthenticated,
  function (req, res) {

    console.log(req.user)
    res.render("index.ejs", {
      id: req.user.UniversityIDUnscoped,
      name: req.user['urn:oid:2.5.4.42'],
    })
  }
);

app.post("/server/points", async (req, res) => {
  if (req.isAuthenticated()) {
    let url = 'https://engsoc.warwick.ac.uk/pdr_app/?pw=qfQ7dTjBMWvxrOf62VbNAzTk53wSodp7yOl8Vt4C6OjTGmnKjY6Z52T9NfXXuzoj&id=' + req.user.UniversityIDUnscoped;
    let data = fetch(url).then(res => res.json())
    return res.send((await data).toString());
  } else {
    return res.status(401).end(`User is not logged in.`);
  }
});

app.post("/server/moreInfo", async (req, res) => {
  if (req.isAuthenticated()) {
    let url = 'https://engsoc.warwick.ac.uk/pdr_app/moreinfo.php?pw=qfQ7dTjBMWvxrOf62VbNAzTk53wSodp7yOl8Vt4C6OjTGmnKjY6Z52T9NfXXuzoj&id=' + req.user.UniversityIDUnscoped;
    let data = fetch(url).then(res => res.text())
    return res.status(200).send((await data).toString());
  } else {
    return res.status(401).end(`User is not logged in.`);
  }
});

app.get('/login',
  passport.authenticate('saml', { failureRedirect: '/login/fail' }),
  function (req, res) {
    res.redirect('/');
  }
);

app.post("/saml/consume",
  bodyParser.urlencoded({ extended: false }),
  passport.authenticate("saml", { failureRedirect: "/", failureFlash: true }),
  function (req, res) {
    console.log('Hit');
    res.redirect("/");
  }
);

app.get('/login/fail',
  function (req, res) {
    res.status(401).send('Login failed');
  }
);


app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/loggedout.html');
});

app.get('/Shibboleth.sso/Metadata',
  function (req, res) {
    res.type('application/xml');
    res.status(200).send(strategy.generateServiceProviderMetadata());
  }
);

//general error handler
app.use(function (err, req, res, next) {
  console.log("Fatal error: " + JSON.stringify(err));
  next(err);
});


app.use(express.static(path.join(__dirname, "public")));
app.use('/pwa-install-prompt', express.static(__dirname + '/node_modules/pwa-install-prompt/'));

// console.log(strategy.generateServiceProviderMetadata(decryptionCert));

const listener = app.listen(42056, function () {
  console.log("Listening on port " + listener.address().port);
});

const { response } = require("express");
const path = require("path");
const express = require("express");
const fs = require("fs");
const fetch = require("node-fetch");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const passport = require("passport");
const saml = require("passport-saml").Strategy;
const signingCert = fs.readFileSync("./idpSigning.crt", "utf-8");


passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const strategy = new saml(
  {
    entryPoint: "https://idp.warwick.ac.uk/idp/profile/SAML2/Redirect/SSO",
    issuer: "Warwick Engineering Society PDR",
    protocol: "https://",
    logoutUrl: "https://idp.warwick.ac.uk/idp/profile/Logout",
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
app.use(session(
  {
    secret: "my super secret secret",
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      maxAge: 99999999999 // <- approx 3 years 
    },
  }
));
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
  async (req, res) => {
    if (req.isAuthenticated()) {
      console.log(req.user)
      res.render("index.ejs", {
        id: req.user.UniversityIDUnscoped,
        name: req.user['urn:oid:2.5.4.42'],
        buttonValue: "Log out",
        buttonLink: "logout"
      });
    } else {
      res.render("index.ejs", {
        id: "0",
        name: "Stranger",
        buttonValue: "Login",
        buttonLink: "login"
      });
    }
  }
);

app.post("/server/points", async (req, res) => {
  if (req.isAuthenticated()) {
    let url = 'https://engsoc.warwick.ac.uk/pdr_app/?pw=qfQ7dTjBMWvxrOf62VbNAzTk53wSodp7yOl8Vt4C6OjTGmnKjY6Z52T9NfXXuzoj&id=' + req.user.UniversityIDUnscoped;
    let data = fetch(url).then(res => res.json())
    return res.send((await data).toString());
  } else {
    return res.status(401).end(`Please login`);
  }
});

app.post("/server/moreInfo", async (req, res) => {
  if (req.isAuthenticated()) {
    let url = 'https://engsoc.warwick.ac.uk/pdr_app/moreinfo.php?pw=qfQ7dTjBMWvxrOf62VbNAzTk53wSodp7yOl8Vt4C6OjTGmnKjY6Z52T9NfXXuzoj&id=' + req.user.UniversityIDUnscoped;
    let data = fetch(url).then(res => res.text())
    return res.status(200).send((await data).toString());
  } else {
    return res.status(401).end(`User is not logged in. Please login`);
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
    let today = new Date();
    let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    console.log('=========================================================')
    console.log(date + ' ' + time);
    res.redirect("/");
  }
);

app.get('/loggedIn', async (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).send(true);
  } else {
    return res.status(200).send(false);
  }
});

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

const listener = app.listen(42056, function () {
  console.log("Listening on port " + listener.address().port);
});

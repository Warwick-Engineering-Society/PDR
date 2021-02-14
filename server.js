require("dotenv").config();
const { response } = require("express");
const path = require("path");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const indexRouter = require("./routes/index");
const engsocRouter = require("./routes/engsoc");
const samlRouter = require("./routes/saml");

const app = express();

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        rolling: true,
        cookie: {
            maxAge: 99999999999, // <- approx 3 years
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.set("view-engine", "ejs");

app.use("/", indexRouter);
app.use("/saml", samlRouter);
app.use("/server", engsocRouter);
app.use("/pwa-install-prompt", express.static(__dirname + "/node_modules/pwa-install-prompt/"));
app.use(express.static(path.join(__dirname, "public")));

const listener = app.listen(process.env.PORT, function () {
    console.log("Listening on port " + listener.address().port);
});

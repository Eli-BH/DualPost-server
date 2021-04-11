require("dotenv").config();
const express = require("express");

const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passportSetup = require("./config/passportSetup");
const twitterRoutes = require("./routes/twitterRoutes.js");
const linkedinRoutes = require("./routes/linkedInRoutes");
const sharedRoutes = require("./routes/sharedRoutes");
const port = 3001 || process.env.PORT;
const app = express();

//middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);
//session middlware
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use("/twitter", twitterRoutes);
app.use("/linkedin", linkedinRoutes);
app.use("/shared", sharedRoutes);

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

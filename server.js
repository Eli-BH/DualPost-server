require("dotenv").config();
const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const Twit = require("twit");
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const cookieParser = require("cookie-parser");
const session = require("express-session");
const port = 3001 || process.env.PORT;
const app = express();

//twitter user info stored here
let twitterUser = {};
//linkedin user info stored here
let linkedInUser = {};
//twitter tokens
let twitterTokens = {};
//linkedin tokens
let linkedInTokens = {};

//passport setup
//twitter
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: "http://localhost:3001/auth/twitter/callback",
    },
    function (token, tokenSecret, twitterProfile, cb) {
      twitterTokens.token = token;
      twitterTokens.tokenSecret = tokenSecret;
      return cb(null, twitterProfile);
    }
  )
);

passport.serializeUser(function (twitterUser, cb) {
  cb(null, twitterUser);
});

passport.deserializeUser(function (twitterObj, cb) {
  cb(null, twitterObj);
});

//linkedin
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LI_CLIENT_ID,
      clientSecret: process.env.LI_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile", "w_member_social"],
      state: true,
    },
    function (accessToken, refreshToken, linkedInProfile, done) {
      process.nextTick(function () {
        linkedInTokens.accessToken = accessToken;
        linkedInTokens.refreshToken = refreshToken;
        return done(null, linkedInProfile);
      });
    }
  )
);

passport.serializeUser(function (linkedInUser, cb) {
  cb(null, linkedInUser);
});

passport.deserializeUser(function (linkedInObj, cb) {
  cb(null, linkedInObj);
});

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

//twitter server routes
//++
//++
//++
app.get("/auth/twitter/login", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", {
    failureRedirect: "http://localhost:3000",
  }),
  function (req, res) {
    twitterUser = req.user;
    res.redirect("http://localhost:3000");
  }
);

//route to post
app.post("/twitter/post", (req, res) => {
  let T = new Twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: twitterTokens.token,
    access_token_secret: twitterTokens.tokenSecret,
  });

  T.post(
    "statuses/update",
    {
      status: "Hello world! - Posted with a dualpost app i am making",
    },
    function (err, data, response) {
      if (err) return res.status(400).json(err);
      res.status(200).json({ data, response });
    }
  );
});

//sends the user data
app.get("/twitter/getuser", (req, res) => {
  res.json({
    twitterUser,
    twitterTokens,
  });
});

//logout route
app.get("/logout", (req, res) => {
  twitterUser = null;
  linkedInUser = null;
  req.session.destroy((err) => res.redirect("http://localhost:3000"));
});

//++
//++
//++
//twitter server routes end

//linkedin server routes
//++
//++
//++

//login
app.get("/auth/linkedin/login", passport.authenticate("linkedin"));

//get user information
app.get("/linkedin/getuser", (req, res) => {
  res.json({
    linkedInUser,
    linkedInTokens,
  });
});

//post to linkedin
app.get("/linkedin/share", (req, res) => {
  let postData = {
    author: `urn:li:person:${linkedInUser.id}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: "Hello world! - Posted with a dualpost app i am making",
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };
  // hit share request
  axios
    .post("https://api.linkedin.com/v2/ugcPosts", postData, {
      headers: {
        "X-Restli-Protocol-Version": "2.0.0",
        Authorization: `Bearer ${linkedInTokens.accessToken}`,
      },
    })
    .then((response) => {
      console.log(response.data);
      res.status(200).send(response.data);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err.data);
    });
});

app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", {
    failureRedirect: "http://localhost:3000",
  }),
  function (req, res) {
    linkedInUser = req.user;

    res.redirect("http://localhost:3000");
  }
);
//++
//++
//++
//linkedin server routes end

//server access port
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

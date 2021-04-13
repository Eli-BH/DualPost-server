require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const cookieParser = require("cookie-parser");
const session = require("express-session");
const axios = require("axios");
const Twit = require("twit");
const port = process.env.PORT || 3001;
const app = express();

//twitter and linkedin user objects
//stores the userinfo and tokens
let twitterUser = {};
let linkedInUser = {};

//passport twitter setup
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK,
    },
    (token, tokenSecret, twitterProfile, cb) => {
      twitterUser.token = token;
      twitterUser.tokenSecret = tokenSecret;
      return cb(null, twitterProfile);
    }
  )
);

//linkedin passport setup
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LI_CLIENT_ID,
      clientSecret: process.env.LI_CLIENT_SECRET,
      callbackURL: process.env.LI_CALLBACK,
      scope: ["r_emailaddress", "r_liteprofile", "w_member_social"],
      state: true,
    },
    (accessToken, refreshToken, linkedInProfile, done) => {
      process.nextTick(() => {
        linkedInUser.accessToken = accessToken;
        linkedInUser.refreshToken = refreshToken;
        return done(null, linkedInProfile);
      });
    }
  )
);

//serialize user, will be updated to be serialized in to DB
passport.serializeUser((user, cb) => {
  cb(null, user);
});

//deserialize user, will be updated to get the user from the db
passport.deserializeUser((obj, cb) => {
  cb(null, obj);
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
//session middleware
app.use(passport.initialize());
app.use(passport.session());

//twitter server routes
//route to login
app.get("/auth/twitter/login", passport.authenticate("twitter"));

//twitter callback
app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", {
    failureRedirect: process.env.CLIENT,
  }),
  (req, res) => {
    twitterUser.user = { ...req.user };
    res.redirect(process.env.CLIENT);
  }
);

//sends the user data
app.get("/twitter/getuser", (req, res) => {
  res.json({
    twitterUser,
    linkedInUser,
  });
});

//linkedin login
app.get("/auth/linkedin/login", passport.authenticate("linkedin"));

//linkedin callback
app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", {
    failureRedirect: process.env.CLIENT,
  }),
  (req, res) => {
    //successfull authentication, redirect to the homepage
    linkedInUser.user = { ...req.user };
    res.redirect(process.env.CLIENT);
  }
);

//route to post to both twitter and linkedin
app.post("/post", (req, res) => {
  const { post } = req.body;
  //posts to twitter
  let T = new Twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: twitterUser.token,
    access_token_secret: twitterUser.tokenSecret,
  });

  T.post(
    "statuses/update",
    {
      status: post,
    },
    function (err, data, response) {
      if (err) return res.status(400).json(err);
      res.status(200).json({ data, response });
    }
  );

  //posts to linkedin
  let postData = {
    author: `urn:li:person:${linkedInUser.user.id}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: post,
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
        Authorization: `Bearer ${linkedInUser.accessToken}`,
      },
    })
    .then((response) => {
      res.status(200).send(response.data);
    })
    .catch((err) => {
      res.status(400).send(err.data);
    });
});

//logout route
app.get("/logout", (req, res) => {
  twitterUser = {};
  linkedInUser = {};
  req.session.destroy((err) => res.redirect(process.env.CLIENT));
});

//route to check if the server is running
app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

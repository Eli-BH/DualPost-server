const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const { twitterTokens, linkedInTokens } = require("./userObjects");
//
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: "http://localhost:3001/twitter/auth/callback",
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
      callbackURL: "http://localhost:3001/linkedin/auth/callback",
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

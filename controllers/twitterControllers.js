const passport = require("passport");

//passport login
const twitterLogin = passport.authenticate("twitter");

module.exports = {
  twitterLogin: twitterLogin,
};

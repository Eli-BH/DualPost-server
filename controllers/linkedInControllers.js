const passport = require("passport");

const login = passport.authenticate("linkedin");

module.exports = {
  login,
};

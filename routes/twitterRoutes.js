const express = require("express");
const passport = require("passport");
let { twitterUser } = require("../config/userObjects");
const { twitterLogin } = require("../controllers/twitterControllers");

const router = express.Router();

router.get("/auth/login", twitterLogin);
router.get(
  "/auth/callback",
  passport.authenticate("twitter", {
    failureRedirect: "http://localhost:3000",
  }),
  function (req, res) {
    twitterUser.user = req.user;
    res.redirect("http://localhost:3000");
  }
);

module.exports = router;

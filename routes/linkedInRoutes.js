const express = require("express");
const passport = require("passport");
let linkedinUser = require("../config/userObjects");
const {
  linkedinCallback,
  login,
} = require("../controllers/linkedInControllers");

const router = express.Router();

router.get("/auth/login", login);

router.get(
  "/auth/callback",
  passport.authenticate("linkedin", {
    failureRedirect: "http://localhost:3000",
  }),
  function (req, res) {
    linkedinUser.linkedInUser.user = req.user;
    console.log(req.user);
    res.redirect("http://localhost:3000");
  }
);

module.exports = router;

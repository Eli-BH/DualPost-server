const express = require("express");
const { getUsers, logout, post } = require("../controllers/sharedControllers");

const router = express.Router();

router.post("/post", post);
router.get("/getuser", getUsers);
router.get("/logout", logout);

module.exports = router;

const Twit = require("twit");
const axios = require("axios");
let { twitterUser, linkedInUser } = require("../config/userObjects");
let { twitterTokens, linkedInTokens } = require("../config/userObjects.js");

const getUsers = (req, res) => {
  res.json({
    twitterUser,
    linkedInUser,
  });
};

const logout = (req, res) => {
  twitterUser = null;
  linkedInUser = null;
  linkedInTokens = null;
  twitterTokens = null;
  req.session.destroy((err) => res.redirect("http://localhost:3000"));
};

const post = (req, res) => {
  //twitter post
  const { post } = req.body;
  let T = new Twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET,
    access_token: twitterTokens.token,
    access_token_secret: twitterTokens.tokenSecret,
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

  //linkedin post
  let postData = {
    author: `urn:li:person:${linkedInUser.id}`,
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
};

module.exports = {
  getUsers: getUsers,
  logout: logout,
  post: post,
};

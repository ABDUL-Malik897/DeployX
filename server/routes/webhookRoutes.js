const express = require("express");

const {
    githubWebhook,
    updateDeploymentFromGitHub
} = require("../controllers/webhookController");

const router = express.Router();

// --------------------------------------------------
// GitHub repository webhook
// --------------------------------------------------

router.post(
    "/github",
    githubWebhook
);

// --------------------------------------------------
// GitHub Actions deployment callback
// --------------------------------------------------

router.post(
    "/deployment",
    updateDeploymentFromGitHub
);

module.exports = router;
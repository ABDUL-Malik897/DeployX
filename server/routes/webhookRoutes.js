const express = require("express");
const { githubWebhook, updateDeploymentFromGitHub } = require("../controllers/webhookController");

const router = express.Router();

router.post("/github", githubWebhook);
router.post("/deployment", updateDeploymentFromGitHub);

module.exports = router;
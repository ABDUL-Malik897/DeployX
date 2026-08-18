const express = require("express");
const requireAuth = require("../middleware/authMiddleware");
const { getRepositories, getBranches, inspectRepository } = require("../controllers/githubController");

const router = express.Router();

router.get("/repositories", requireAuth, getRepositories);
router.get("/repositories/:owner/:repo/branches", requireAuth, getBranches);
router.get("/repositories/:owner/:repo/inspect/:branch", requireAuth, inspectRepository);

module.exports = router;
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const { getDashboard } = require("../controllers/dashboardController");

router.get("/", requireAuth, getDashboard);

module.exports = router;
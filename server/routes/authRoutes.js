const express = require("express");
const { signup, login, googleLogin, getMe, updateProfile, changePassword, updatePreferences, updateNotifications, connectGithub, githubLogin, githubCallback } = require("../controllers/authController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", requireAuth, getMe);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);
router.put("/preferences", requireAuth, updatePreferences);
router.put("/notifications", requireAuth, updateNotifications);
router.post("/github/connect", requireAuth, connectGithub);
router.get("/github", githubLogin);
router.get("/github/callback", githubCallback);

module.exports = router;
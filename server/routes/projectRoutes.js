const express = require("express");
const { createProject, getProjects, getProject, updateEnvironmentVariables, updateProject, addCustomDomain, getCustomDomains, deleteCustomDomain, verifyCustomDomain } = require("../controllers/projectController");
const requireAuth = require("../middleware/authMiddleware");
const router = express.Router();
router.use(requireAuth);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProject);
router.put("/:id", updateProject);
router.put("/:id/environment", updateEnvironmentVariables);
router.post("/:id/domains", addCustomDomain);
router.get("/:id/domains", getCustomDomains);
router.delete("/:id/domains/:domain", deleteCustomDomain);
router.post("/:id/domains/:domain/verify", verifyCustomDomain);

module.exports = router;
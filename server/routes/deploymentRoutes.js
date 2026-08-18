const express = require("express");
const { createDeployment, getProjectDeployments, getDeployment, getAllDeployments, redeployDeployment, rollbackDeployment } = require("../controllers/deploymentController");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();
router.use(requireAuth);

router.post("/:projectId", createDeployment);
router.get("/project/:projectId", getProjectDeployments);
router.get("/details/:deploymentId", getDeployment);
router.get("/", getAllDeployments);
router.post("/:deploymentId/redeploy", redeployDeployment);
router.post("/:deploymentId/rollback", rollbackDeployment);

module.exports = router;
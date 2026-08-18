const Project = require("../models/Project");
const deployProject = require("../services/deploymentService");
const verifyGithubSignature = require("../utils/verifyGithubSignature");

const githubWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-hub-signature-256"];
        const valid = verifyGithubSignature(req.rawBody,signature);
        if (!valid) {
            return res.status(401).json({
                message: "Invalid GitHub signature"
            });
        }
        const event = req.headers["x-github-event"];
        if (event === "ping") {
            return res.status(200).json({
                message: "DeployX webhook connected"
            });
        }
        if (event !== "push") {
            return res.status(200).json({
                message: `Ignored ${event} event`
            });
        }
        const repository = req.body.repository?.full_name;
        if (!repository) {
            return res.status(400).json({
                message: "Repository missing"
            });
        }
        const project = await Project.findOne({
            githubFullName: repository
        });
        if (!project) {
            return res.status(200).json({
                message:"No DeployX project connected to this repository"
            });
        }
        console.log("Repository:", repository);
        console.log("Project:", project);
        res.status(202).json({
            message: "Deployment started"
        });
        deployProject(project)
            .then(deployment => {
                console.log("GitHub deployment successful:", deployment._id);
            })
            .catch(error => {
                console.error("GitHub deployment failed:",error.message);
            });
    } catch (error) {
        console.error("GitHub webhook error:",error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Webhook failed"
            });
        }
    }
};

module.exports = {
    githubWebhook
};
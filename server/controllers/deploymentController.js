const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const { triggerBuildWorkflow } = require("../utils/githubActions");

const createDeployment = async (req, res) => {
    try {

        const { branch = "main", rootDirectory = "" } = req.body || {};
        const project = await Project.findOne({
            _id: req.params.projectId,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        project.rootDirectory = typeof rootDirectory === "string" ? rootDirectory.trim() : "";
        await project.save();
        const User = require("../models/User");
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.githubInstallationId) {
            return res.status(400).json({
                message: "GitHub is not connected"
            });
        }

        let owner;
        let repo;

        if (project.githubFullName) {
            const parts = project.githubFullName.split("/");

            if (parts.length === 2) {
                owner = parts[0];
                repo = parts[1];
            }
        }

        if (!owner || !repo) {
            const repositoryUrl = project.repository || "";
            const match = repositoryUrl.match(/github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?$/);
            if (match) {
                owner = match[1];
                repo = match[2];
            }
        }
        if (!owner || !repo) {
            return res.status(400).json({
                message: "Unable to determine GitHub repository."
            });
        }

        const deployment =  await Deployment.create({
            project: project._id,
            repository: project.repository,
            branch,
            applicationDirectory: project.rootDirectory || "",
            status: "queued",
            currentStep: "Queued",
            logs: "Deployment queued...\n" + `Branch: ${branch}\n`
        });

        try {
            await triggerBuildWorkflow({
                installationId: user.githubInstallationId,
                owner,
                repo,
                branch,
                rootDirectory: project.rootDirectory || "",
                deploymentId: deployment._id.toString(),
                outputDirectory: project.outputDirectory || "dist",
                projectSlug: project.slug
            });
            deployment.currentStep = "Build Queued";
            deployment.logs += "GitHub Actions build queued.\n";
            await deployment.save();
        } catch (workflowError) {
            deployment.status = "failed";
            deployment.currentStep = "Failed";
            deployment.logs += `\nUnable to start GitHub Actions:\n${workflowError.message}\n`;
            await deployment.save();
            throw workflowError;
        }

        return res.status(202).json({
            message: "Deployment queued successfully",
            deployment
        });
    } catch (error) {
        console.error("Unable to queue deployment:", error);
        return res.status(500).json({
            message:"Unable to queue deployment",
            error: error.message
        });
    }
};

const getProjectDeployments = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.projectId,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        const deployments = await Deployment.find({ project: project._id }).sort({createdAt: -1});
        return res.status(200).json(deployments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to fetch deployments"
        });
    }
};

const getDeployment = async (req, res) => {
    try {
        const deployment = await Deployment.findById(req.params.deploymentId).populate("project", "name owner slug");
        if (!deployment) {
            return res.status(404).json({
                message: "Deployment not found"
            });
        }
        if (deployment.project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }
        return res.status(200).json(deployment);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to fetch deployment"
        });
    }
};

const getAllDeployments = async (req, res) => {
    try {
        const projects = await Project.find({
            owner: req.user._id
        }).select("_id");
        const projectIds = projects.map(project => project._id);
        const deployments = await Deployment.find({
            project: {
                $in: projectIds
            }
        })
        .populate("project","name").sort({ createdAt: -1 });
        return res.status(200).json(deployments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Unable to fetch deployments"
        });
    }
};

const redeployDeployment = async (req, res) => {
    try {

        const deployment = await Deployment.findById(
            req.params.deploymentId
        );
        if (!deployment) {
            return res.status(404).json({
                message: "Deployment not found"
            });
        }
        const project = await Project.findOne({
            _id: deployment.project,
            owner: req.user._id
        });
        if (!project) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }
        const User = require("../models/User");
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (!user.githubInstallationId) {
            return res.status(400).json({
                message: "GitHub is not connected"
            });
        }
        let owner;
        let repo;
        if (project.githubFullName) {
            const parts = project.githubFullName.split("/");
            if (parts.length === 2) {
                owner = parts[0];
                repo = parts[1];
            }
        }

        if (!owner || !repo) {
            const repositoryUrl = project.repository || "";
            const match = repositoryUrl.match(/github\.com\/([^/]+)\/([^/#]+?)(?:\.git)?$/);
            if (match) {
                owner = match[1];
                repo = match[2];
            }
        }

        if (!owner || !repo) {
            return res.status(400).json({
                message: "Unable to determine GitHub repository."
            });
        }

        const newDeployment = await Deployment.create({
            project: project._id,
            repository: project.repository,
            branch: deployment.branch || "main",
            applicationDirectory: project.rootDirectory || "",
            status: "queued",
            currentStep: "Queued",
            logs: "Redeployment queued...\n" + `Branch: ${deployment.branch || "main"}\n`
        });

        try {
            await triggerBuildWorkflow({
                installationId: user.githubInstallationId,
                owner,
                repo,
                branch: deployment.branch || "main",
                rootDirectory: project.rootDirectory || "",
                deploymentId: newDeployment._id.toString(),
                outputDirectory: project.outputDirectory || "dist",
                projectSlug: project.slug
            });

            newDeployment.currentStep = "Build Queued";
            newDeployment.logs += "GitHub Actions build queued.\n";
            await newDeployment.save();

        } catch (workflowError) {
            newDeployment.status = "failed";
            newDeployment.currentStep = "Failed";
            newDeployment.logs += `\nUnable to start GitHub Actions:\n${workflowError.message}\n`;
            await newDeployment.save();
            throw workflowError;
        }

        return res.status(202).json({
            message: "Redeployment queued successfully",
            deployment: newDeployment
        });
    } catch (error) {
        console.error("Redeployment failed:", error);
        return res.status(500).json({
            message: "Redeployment failed",
            error: error.message
        });
    }
};

const rollbackDeployment = async (req, res) => {
    try {
        const deployment = await Deployment.findById(req.params.deploymentId);
        if (!deployment) {
            return res.status(404).json({
                message: "Deployment not found"
            });
        }        if (deployment.status !== "success") {
            return res.status(400).json({
                message: "Only sucessful deployments can be rolled back to."
            });
        }
        const project = await Project.findOne({
            _id: deployment.project,
            owner: req.user._id
        });
        if (!project) {
            return res.status(403).json({
                message: "Not authorized"
            });
        }
        await Deployment.updateMany(
            {
                project: deployment.project
            },
            {
                $set: {
                    isProduction: false
                }
            }
        );
        deployment.isProduction = true;
        project.productionDeployment = deployment._id;
        await project.save();
        await deployment.save();
        return res.status(200).json({
            message:"Deployment rolled back successfully",
            deployment
        });
    } catch (error) {
        console.error("Rollback failed:", error);
        return res.status(500).json({
            message: "Rollback failed",
            error: error.message
        });
    }
};

module.exports = {
    createDeployment,
    getProjectDeployments,
    getDeployment,
    getAllDeployments,
    redeployDeployment,
    rollbackDeployment
};
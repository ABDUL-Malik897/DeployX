const Project = require("../models/Project");
const Deployment = require("../models/Deployment");
const deployProject = require("../services/deploymentService");

const createDeployment = async (req, res) => {
    try {
        const { branch = "main",rootDirectory } = req.body || {};
        const project = await Project.findOne({
            _id: req.params.projectId,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        if (typeof rootDirectory === "string") {
            project.rootDirectory = rootDirectory.trim();
            await project.save();
        }
        const deployment = await deployProject(project, branch);
        return res.status(201).json({
            message: "Deployment built successfully",
            deployment
        });
    } catch (error) {
        console.error("Deployment failed:", error
        );
        return res.status(500).json({
            message: "Deployment failed",
            error: error.message,
            deployment: error.deployment || null
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
        const deployment = await Deployment.findById(req.params.deploymentId);
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
        const newDeployment = await deployProject(project, deployment.branch);
        return res.status(201).json({
            message: "Deployment redeployed successfully",
            deployment: newDeployment
        });
    } catch (error) {
        console.error("Redeployment failed:", error);
        return res.status(500).json({
            message: "Redeployment failed",
            error: error.message,
            deployment: error.deployment || null
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
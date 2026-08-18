const Project = require("../models/Project");
const Deployment = require("../models/Deployment");

const getDashboard = async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments({
            owner: req.user._id
        });
        const projects = await Project.find({
            owner: req.user._id
        }).select("_id");
        const projectIds = projects.map(project => project._id);
        const userDeployments = await Deployment.find({
            project: { $in: projectIds }
        })
        .populate("project")
        .sort({ createdAt: -1 });
        const successfulDeployments = userDeployments.filter(deployment => deployment.status === "success").length;
        const failedDeployments = userDeployments.filter(deployment => deployment.status === "failed").length;
        const queuedDeployments = userDeployments.filter(deployment => deployment.status === "queued").length;
        const buildingDeployments = userDeployments.filter(deployment => deployment.status === "building").length;
        const successRate = userDeployments.length === 0 ? 0 : Math.round(successfulDeployments / userDeployments.length * 100);
        res.json({
            totalProjects,
            totalDeployments: userDeployments.length,
            successfulDeployments,
            failedDeployments,
            queuedDeployments,
            buildingDeployments,
            successRate,
            recentDeployments: userDeployments.slice(0,5)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message:"Unable to load dashboard"
        });
    }
};

module.exports = {
    getDashboard
};
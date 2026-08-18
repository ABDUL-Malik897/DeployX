const express = require("express");
const path = require("path");
const fs = require("fs");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");

const router = express.Router();

const getDeploymentIdFromHost = (host) => {

    if (!host) {
        return null;
    }
    const hostname = host.split(":")[0].toLowerCase();
    const match = hostname.match(/^([a-f0-9]{24})\.localhost$/);
    return match ? match[1] : null;
};

const getProjectSlugFromHost = (host) => {

    if (!host) {
        return null;
    }
    const hostname = host.split(":")[0].toLowerCase();
    const match = hostname.match(/^([a-z0-9]+(?:-[a-z0-9]+)*)\.localhost$/);
    return match ? match[1] : null;
};

const getProductionDeploymentId = async (slug) => {

    const project = await Project.findOne({ slug });
    if (!project) {
        return null;
    }
    if (!project.productionDeployment) {
        return null;
    }
    const deployment = await Deployment.findOne({
        _id: project.productionDeployment,
        project: project._id,
        status: "success"
    });
    if (!deployment) {
        return null;
    }
    return deployment._id.toString();
};

const serveDeployment = async (req, res, next, deploymentId) => {
    try {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            return res.status(404).send("Deployment not found");
        }
        if (deployment.status !== "success") {
            return res.status(400).send("Deployment is not ready");
        }
        const deploymentRoot = path.join(
            __dirname,
            "..",
            "builds",
            deployment._id.toString()
        );
        const applicationDirectory = deployment.applicationDirectory || "";
        const applicationPath = path.resolve(deploymentRoot, applicationDirectory);
        const resolvedRoot = path.resolve(deploymentRoot);
        const resolvedApplication = path.resolve(applicationPath);

        if (resolvedApplication !== resolvedRoot && !resolvedApplication.startsWith(resolvedRoot + path.sep)) {
            return res.status(400).send("Invalid application directory");
        }
        let outputPath;
        if (!deployment.outputDirectory || deployment.outputDirectory === ".") {
            outputPath = applicationPath;
        } else {
            outputPath = path.resolve(applicationPath, deployment.outputDirectory);
        }

        const resolvedOutput = path.resolve(outputPath);
        if (resolvedOutput !== resolvedRoot && !resolvedOutput.startsWith(resolvedRoot + path.sep)) {
            return res.status(400).send("Invalid deployment output");
        }
        if (!fs.existsSync(outputPath)) {
            return res.status(404).send("Build output not found");
        }

        express.static(outputPath,
            {
                index: "index.html"
            }
            )(req, res, () => {
                const indexPath = path.join(outputPath,"index.html");
                if (!fs.existsSync(indexPath)) {
                    return next();
                }
                if (req.method !== "GET" && req.method !== "HEAD") {
                    return next();
                }
                res.sendFile(indexPath);
            });
    } catch (error) {
        console.error("Hosting error:", error);
        return res.status(500).send("Unable to serve deployment");
    }
};

const getProductionDeploymentIdFromDomain = async (domain) => {

    if (!domain) {
        return null;
    }
    const hostname = domain.split(":")[0].toLowerCase().trim();
    const project = await Project.findOne({
        "customDomains": {
            $elemMatch: {
                domain: hostname,
                verified: true
            }
        }
    });

    if (!project) {
        return null;
    }

    if (!project.productionDeployment) {
        return null;
    }

    const deployment = await Deployment.findOne({
        _id: project.productionDeployment,
        project: project._id,
        status: "success"
    });

    if (!deployment) {
        return null;
    }
    return deployment._id.toString();
};

router.use(async (req, res, next) => {
    try {
        const host = req.headers.host;
        if (!host) {
            return next();
        }
        const hostname = host.split(":")[0].toLowerCase().trim();
        if (hostname === "localhost" || hostname.endsWith(".localhost")) {
            return next();
        }
        const deploymentId = await getProductionDeploymentIdFromDomain(hostname);
        if (!deploymentId) {
            return next();
        }
        return serveDeployment(req, res, next, deploymentId);
    } catch (error) {
        console.error("Custom domain hosting error:", error);
        return res.status(500).send("Unable to load custom domain");
    }
});

router.use(async (req, res, next) => {
    const deploymentId = getDeploymentIdFromHost(req.headers.host);
    if (!deploymentId) {
        return next();
    }
    return serveDeployment(req, res, next, deploymentId);
});

router.use(async (req, res, next) => {
    try {
        const slug = getProjectSlugFromHost(req.headers.host);
        if (!slug) {
            return next();
        }
        const deploymentId = await getProductionDeploymentId(slug);
        if (!deploymentId) {
            return res.status(404).send("Production deployment not found");
        }
        return serveDeployment(req, res, next, deploymentId);
    } catch (error) {
        console.error("Production hosting error:", error);
        return res.status(500).send("Unable to load production deployment");
    }
});

router.use("/deployments/:deploymentId",async (req, res, next) => {
    return serveDeployment(req, res, next, req.params.deploymentId);
});

module.exports = router;
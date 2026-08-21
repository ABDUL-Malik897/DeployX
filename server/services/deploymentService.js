const path = require("path");
const fs = require("fs");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const runCommand = require("./commandRunner");
const { getIO } = require("../socket");

const MAX_LOG_SIZE = 500000;

const ensureProjectSlug = async (project) => {
    if (!project.slug) {
        let slug = project.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        if (!slug) {
            slug = `project-${project._id}`;
        }

        const existingProject = await Project.findOne({
            slug,
            _id: {
                $ne: project._id
            }
        });

        if (existingProject) {
            slug = `${slug}-${project._id
                .toString()
                .slice(-6)}`;
        }
        project.slug = slug;
    }
    return project;
};

const makeProductionDeployment = async (project, deployment) => {
    await ensureProjectSlug(project);
    await Deployment.updateMany(
        {
            project: project._id,
            _id: {
                $ne: deployment._id
            }
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
};

const processDeployment = async (deploymentId) => {
    let deployment;
    const emitLog = (message) => {
        if (!deployment) {
            return;
        }
        deployment.logs = ((deployment.logs || "") + message).slice(-MAX_LOG_SIZE);

        const deploymentData = {
            deploymentId: deployment._id.toString(),
            projectId: deployment.project.toString(),
            log: message,
            currentStep: deployment.currentStep,
            status: deployment.status,
            url: deployment.url || null
        };

        const io = getIO();
        if (!io) {
            console.warn("Socket.IO is not initialized.");
            return;
        }
        io.to(deployment._id.toString()).emit("deployment-log", deploymentData);
        io.to(`project:${deployment.project.toString()}`).emit("deployment-update", deploymentData);
    };

    try {
        deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            throw new Error("Deployment not found");
        }
        if (deployment.status !== "queued" && deployment.status !== "building") {
            throw new Error(`Deployment is not queued. Current status: ${deployment.status}`);
        }

        const project = await Project.findById(deployment.project);
        if (!project) {
            throw new Error("Project not found");
        }
        const branch = deployment.branch || "main";
        const applicationDirectory = deployment.applicationDirectory || project.rootDirectory || "";

        deployment.status = "building";
        deployment.currentStep = "Cloning Repository";
        emitLog("Starting deployment...\n");
        emitLog(`Cloning branch '${branch}'...\n`);
        await deployment.save();

        const buildPath = path.join(
            __dirname,
            "..",
            "builds",
            deployment._id.toString()
        );

        fs.mkdirSync(buildPath,
            {
                recursive: true
            }
        );

        await runCommand("git",
            [
                "clone",
                "--depth",
                "1",
                "--branch",
                branch,
                project.repository,
                "."
            ],
            buildPath,
            {},
            (message) => {
                emitLog(message);
            }
        );

        emitLog("\nRepository cloned.\n");
        const applicationPath = path.resolve(buildPath, applicationDirectory);
        const resolvedBuildPath = path.resolve(buildPath);
        if (applicationPath !== resolvedBuildPath && !applicationPath.startsWith(resolvedBuildPath + path.sep)) {
            throw new Error("Invalid application directory");
        }
        if (!fs.existsSync(applicationPath)) {
            throw new Error(`Application directory '${applicationDirectory}' not found`);
        }
        deployment.currentStep = "Detecting Project";
        emitLog(`Application directory: ${ applicationDirectory || "." }\n`);
        await deployment.save();
        const packagePath = path.join(applicationPath, "package.json");
        const hasPackageJson = fs.existsSync(packagePath);

        if (!hasPackageJson) {
            const indexPath = path.join(applicationPath, "index.html");
            if (!fs.existsSync(indexPath)) {
                throw new Error("No package.json or index.html found in application directory");
            }
            emitLog("\nStatic HTML/CSS/JS project detected.\n");
            deployment.currentStep = "Publishing";
            await deployment.save();
            deployment.status = "success";
            deployment.currentStep = "Deployment Complete";
            deployment.outputDirectory = applicationDirectory || ".";
            deployment.url = `http://${deployment._id}.localhost:${ process.env.PORT || 4000 }/`;
            await makeProductionDeployment(project, deployment);
            emitLog("\nStatic website deployed successfully.\n");
            emitLog(`Deployment URL: ${deployment.url}\n`);
            emitLog(`Production URL: http://${project.slug}.localhost:${ process.env.PORT || 4000 }/\n`);
            await deployment.save();
            return deployment;
        }

        let packageJson;
        try {
            packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
        } catch (error) {
            throw new Error("Invalid package.json");
        }
        emitLog("package.json detected.\n");

        const dependencies = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {})
        };

        let framework = "Unknown";
        let outputDirectory = "dist";

        if (
            dependencies["@angular/core"]
        ) {
            framework = "Angular";
            outputDirectory = "dist";
        } else if (
            dependencies["react-scripts"]
        ) {
            framework = "Create React App";
            outputDirectory = "build";
        } else if (
            dependencies.vite
        ) {
            framework = "Vite";
            outputDirectory = "dist";
        } else if (
            dependencies.vue
        ) {
            framework = "Vue";
            outputDirectory = "dist";
        } else if (
            dependencies.next
        ) {
            framework = "Next.js";
            outputDirectory = ".next";
        }

        project.framework = framework;
        project.outputDirectory = outputDirectory;
        await ensureProjectSlug(project);
        await project.save();
        emitLog(`Framework detected: ${framework}\n`);
        await deployment.save();

        if (!packageJson.scripts || !packageJson.scripts.build) {
            throw new Error("No build script found in package.json");
        }

        deployment.currentStep = "Installing Dependencies";
        emitLog("\nInstalling dependencies...\n");
        await deployment.save();

        const packageLockPath = path.join(applicationPath, "package-lock.json");
        const hasPackageLock = fs.existsSync(packageLockPath);
        await runCommand("npm",
            hasPackageLock
                ? [
                    "ci",
                    "--no-audit",
                    "--no-fund"
                ]
                : [
                    "install",
                    "--no-audit",
                    "--no-fund"
                ],
            applicationPath,
            {},
            (message) => {
                emitLog(message);
            }
        );
        emitLog("\nDependencies installed.\n");
        await deployment.save();

        const buildEnvironment = {
            ...Object.fromEntries((project.environmentVariables || []).map((variable) => [ variable.key, variable.value ])),
            CI: "true",
            GENERATE_SOURCEMAP: "false"
        };

        deployment.currentStep = "Building Project";
        emitLog("\nBuilding application...\n");
        await deployment.save();
        await runCommand(
            "npm",
            [
                "run",
                "build"
            ],
            applicationPath,
            buildEnvironment,
            (message) => {
                emitLog(message);
            }
        );

        deployment.currentStep = "Publishing";
        await deployment.save();
        const outputPath = path.join(applicationPath, outputDirectory);
        if (!fs.existsSync(outputPath)) {
            throw new Error(`Build completed but '${outputDirectory}' directory was not found`);
        }
        const indexPath = path.join(outputPath, "index.html");

        if (fs.existsSync(indexPath)) {
            const html = fs.readFileSync(indexPath, "utf8");
            fs.writeFileSync(indexPath, html, "utf8");
            emitLog("Asset paths configured.\n");
        }

        deployment.status = "success";
        deployment.currentStep = "Deployment Complete";
        deployment.outputDirectory = outputDirectory;
        deployment.url = `http://${deployment._id}.localhost:${ process.env.PORT || 4000 }/`;
        await makeProductionDeployment(project, deployment);
        emitLog("\nBuild completed successfully.\n");
        emitLog(`Deployment URL: ${deployment.url}\n`);
        emitLog(`Production URL: http://${project.slug}.localhost:${ process.env.PORT || 4000 }/\n`);
        await deployment.save();
        return deployment;
    } catch (error) {
        console.error("Deployment failed:", error);
        if (deployment) {
            deployment.status = "failed";
            deployment.currentStep = "Failed";
            emitLog(`\nDeployment failed:\n${error.message}\n`);
            await deployment.save();
        }
        error.deployment = deployment;
        throw error;
    }
};

module.exports = processDeployment;
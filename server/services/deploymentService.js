const path = require("path");
const fs = require("fs");
const Deployment = require("../models/Deployment");
const Project = require("../models/Project");
const runCommand = require("./commandRunner");
const { getIO } = require("../socket");

const ensureProjectSlug = async (project) => {

    if (!project.slug) {
        let slug = project.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (!slug) {
            slug = `project-${project._id}`;
        }
        let existingProject = await Project.findOne({
            slug,
            _id: {
                $ne: project._id
            }
        });
        if (existingProject) {
            slug = `${slug}-${project._id.toString().slice(-6)}`;
        }
        project.slug = slug;
    }
    return project;
};

const makeProductionDeployment = async (project, deployment) => {

    await ensureProjectSlug(project);

    await Deployment.updateMany(
        {
            project: project._id
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

const deployProject = async (project, branch = "main") => {

    let deployment;
    const emitLog = (deployment, message) => {
        deployment.logs += message;
        const deploymentData = {
            deploymentId: deployment._id.toString(),
            projectId: deployment.project.toString(),
            log: message,
            currentStep: deployment.currentStep,
            status: deployment.status,
            url: deployment.url || null
        };

        getIO().to(deployment._id.toString()).emit("deployment-log", deploymentData);
        getIO().to(`project:${deployment.project.toString()}`).emit("deployment-update",deploymentData);
    };

    try {
        deployment = await Deployment.create({
            project: project._id,
            repository: project.repository,
            branch,
            applicationDirectory: project.rootDirectory || "",
            status: "queued",
            currentStep: "Queued",
            logs:`Deployment queued...\n` + `Branch: ${branch}\n`
        });

        getIO().to(`project:${project._id.toString()}`).emit("deployment-update", {
            deploymentId: deployment._id.toString(),
            projectId: project._id.toString(),
            log: deployment.logs,
            currentStep: deployment.currentStep,
            status: deployment.status,
            url: null
            }
        );

        const buildPath = path.join(
            __dirname,
            "..",
            "builds",
            deployment._id.toString()
        );

        fs.mkdirSync(buildPath, {
            recursive:true
        });

        deployment.status = "building";
        deployment.currentStep ="Cloning Repository";
        emitLog(deployment, "Starting deployment...\n");
        emitLog(deployment,`Cloning branch '${branch}'...\n`);
        await deployment.save();

        const cloneLogs = await runCommand(
            "git",
            [
                "clone",
                "--depth",
                "1",
                "--branch",
                branch,
                project.repository,
                "."
            ],
            buildPath
        );

        const applicationPath = path.resolve(buildPath, project.rootDirectory || "");
        if (applicationPath !== buildPath && !applicationPath.startsWith(buildPath + path.sep)) {
            throw new Error("Invalid application directory");
        }

        if (!fs.existsSync(applicationPath)) {
            throw new Error(`Application directory '${project.rootDirectory}' not found`);
        }

        deployment.currentStep = "Detecting Project";
        emitLog(deployment, cloneLogs);
        emitLog(deployment, "\nRepository cloned.\n");
        emitLog(deployment, `Application directory: ${ project.rootDirectory || "." }\n`);
        await deployment.save();
        const packagePath = path.join(applicationPath, "package.json");
        const hasPackageJson = fs.existsSync(packagePath);
        if (!hasPackageJson) {
            const indexPath = path.join(applicationPath, "index.html");
            if (!fs.existsSync(indexPath)) {
                throw new Error("No package.json or index.html found in application directory");
            }
            emitLog(deployment, "\nStatic HTML/CSS/JS project detected.\n");
            deployment.currentStep = "Publishing";
            await deployment.save();
            deployment.status = "success";
            deployment.currentStep = "Deployment Complete";
            deployment.outputDirectory = project.rootDirectory || ".";
            deployment.url = `http://${deployment._id}.localhost:${ process.env.PORT || 4000 }/`;
            await makeProductionDeployment(project,deployment);
            emitLog(deployment,"\nStatic website deployed successfully.\n");
            emitLog(deployment,`Deployment URL: ${deployment.url}\n`);
            emitLog(deployment, `Production URL: http://${project.slug}.localhost:${ process.env.PORT || 4000 }/\n`);
            await deployment.save();
            return deployment;
        }

        const packageJson = JSON.parse(fs.readFileSync(packagePath,"utf-8"));
        emitLog(deployment, "package.json detected.\n");
        const dependencies = {
            ...(packageJson.dependencies || {}),
            ...(packageJson.devDependencies || {})
        };

        let framework = "Unknown";
        let outputDirectory = "dist";
        if (dependencies["@angular/core"]) {
            framework = "Angular";
            outputDirectory = "dist";
        }
        else if (dependencies["react-scripts"]) {
            framework = "Create React App";
            outputDirectory = "build";
        }
        else if (dependencies.vite) {
            framework = "Vite";
            outputDirectory = "dist";
        }
        else if (dependencies.vue) {
            framework = "Vue";
            outputDirectory = "dist";
        }
        else if (dependencies.next) {
            framework = "Next.js";
            outputDirectory = ".next";
        }

        project.framework = framework;
        project.outputDirectory = outputDirectory;
        await ensureProjectSlug(project);
        await project.save();
        emitLog(deployment, `Framework detected: ${framework}\n`);
        await deployment.save();
        if (!packageJson.scripts?.build ) {
            throw new Error("No build script found in package.json");
        }

        emitLog(deployment, "\nInstalling dependencies...\n");
        deployment.currentStep = "Installing Dependencies";
        await deployment.save();
        const hasPackageLock = fs.existsSync(path.join(applicationPath, "package-lock.json"));
        const installLogs = await runCommand("npm", hasPackageLock ? ["ci"] : ["install"], applicationPath);
        emitLog(deployment, installLogs);
        emitLog(deployment, "\nDependencies installed.\n");
        await deployment.save();
        const buildEnvironment = {};
        for (const variable of project.environmentVariables || []) {
            buildEnvironment[variable.key] = variable.value;
        }

        deployment.currentStep = "Building Project";
        emitLog(deployment, "\nBuilding application...\n");
        await deployment.save();
        const buildLogs = await runCommand(
            "npm",
            [
                "run",
                "build"
            ],
            applicationPath,
            buildEnvironment
        );

        emitLog(deployment, buildLogs);
        deployment.currentStep = "Publishing";
        await deployment.save();
        const outputPath = path.join(applicationPath, outputDirectory);
        if (fs.existsSync(outputPath)) {
            throw new Error(`Build completed but '${outputDirectory}' directory was not found`);
        }

        const indexPath = path.join(outputPath,"index.html");
        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, "utf-8");
            fs.writeFileSync(indexPath, html, "utf-8");
            emitLog(deployment, "Asset paths configured.\n");
        }

        deployment.status = "success";
        deployment.currentStep = "Deployment Complete";
        deployment.outputDirectory = outputDirectory;
        deployment.url = `http://${deployment._id}.localhost:${process.env.PORT || 4000}/`;
        await makeProductionDeployment(project,deployment);
        emitLog(deployment, "\nBuild completed successfully.\n");
        emitLog(deployment, `Deployment URL: ${deployment.url}\n`);
        emitLog(deployment, `Production URL: http://${project.slug}.localhost:${process.env.PORT || 4000}/\n`);
        await deployment.save();
        return deployment;
    } catch (error) {

        console.error("Deployment failed:", error);
        if (deployment) { 
            deployment.status ="failed";
            deployment.currentStep = "Failed";
            emitLog(deployment, `\nDeployment failed:\n${error.message}\n`);
            await deployment.save();
        }
        error.deployment = deployment;
        throw error;
    }
};

module.exports = deployProject;
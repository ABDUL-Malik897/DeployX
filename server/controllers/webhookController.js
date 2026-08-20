// const Project = require("../models/Project");
// const deployProject = require("../services/deploymentService");
// const verifyGithubSignature = require("../utils/verifyGithubSignature");
// const Deployment = require("../models/Deployment");
// const crypto = require("crypto");


// const githubWebhook = async (req, res) => {
//     try {
//         const signature = req.headers["x-hub-signature-256"];
//         const valid = verifyGithubSignature(req.rawBody,signature);
//         if (!valid) {
//             return res.status(401).json({
//                 message: "Invalid GitHub signature"
//             });
//         }
//         const event = req.headers["x-github-event"];
//         if (event === "ping") {
//             return res.status(200).json({
//                 message: "DeployX webhook connected"
//             });
//         }
//         if (event !== "push") {
//             return res.status(200).json({
//                 message: `Ignored ${event} event`
//             });
//         }
//         const repository = req.body.repository?.full_name;
//         if (!repository) {
//             return res.status(400).json({
//                 message: "Repository missing"
//             });
//         }
//         const project = await Project.findOne({
//             githubFullName: repository
//         });
//         if (!project) {
//             return res.status(200).json({
//                 message:"No DeployX project connected to this repository"
//             });
//         }
//         console.log("Repository:", repository);
//         console.log("Project:", project);
//         res.status(202).json({
//             message: "Deployment started"
//         });
//         deployProject(project)
//             .then(deployment => {
//                 console.log("GitHub deployment successful:", deployment._id);
//             })
//             .catch(error => {
//                 console.error("GitHub deployment failed:",error.message);
//             });
//     } catch (error) {
//         console.error("GitHub webhook error:",error);
//         if (!res.headersSent) {
//             res.status(500).json({
//                 message: "Webhook failed"
//             });
//         }
//     }
// };


// const updateDeploymentFromGitHub = async (req, res) => {
//     try {
//         const {
//             deploymentId,
//             status,
//             url,
//             logs,
//             currentStep,
//             outputDirectory
//         } = req.body || {};

//         if (!deploymentId) {
//             return res.status(400).json({
//                 message: "Deployment ID is required"
//             });
//         }

//         const deployment =
//             await Deployment.findById(deploymentId);

//         if (!deployment) {
//             return res.status(404).json({
//                 message: "Deployment not found"
//             });
//         }

//         const project =
//             await Project.findById(deployment.project);

//         if (!project) {
//             return res.status(404).json({
//                 message: "Project not found"
//             });
//         }

//         // ----------------------------------------
//         // Update logs
//         // ----------------------------------------

//         if (typeof logs === "string" && logs.trim()) {
//             deployment.logs =
//                 `${deployment.logs || ""}${logs}`;
//         }

//         // ----------------------------------------
//         // Update current step
//         // ----------------------------------------

//         if (currentStep) {
//             deployment.currentStep =
//                 currentStep;
//         }

//         // ----------------------------------------
//         // Update output directory
//         // ----------------------------------------

//         if (outputDirectory) {
//             deployment.outputDirectory =
//                 outputDirectory;
//         }

//         // ----------------------------------------
//         // Update deployment URL
//         // ----------------------------------------

//         if (url) {
//             deployment.url = url;
//         }

//         // ----------------------------------------
//         // Update status
//         // ----------------------------------------

//         if (
//             ["queued", "building", "success", "failed"]
//                 .includes(status)
//         ) {
//             deployment.status = status;
//         }

//         // ----------------------------------------
//         // Production deployment
//         // ----------------------------------------

//         if (
//             status === "success" &&
//             url
//         ) {
//             await Deployment.updateMany(
//                 {
//                     project: project._id,
//                     _id: {
//                         $ne: deployment._id
//                     }
//                 },
//                 {
//                     $set: {
//                         isProduction: false
//                     }
//                 }
//             );

//             deployment.isProduction =
//                 true;

//             project.productionDeployment =
//                 deployment._id;

//             await project.save();
//         }

//         await deployment.save();

//         return res.status(200).json({
//             message:
//                 "Deployment updated successfully",
//             deployment
//         });

//     } catch (error) {

//         console.error(
//             "GitHub deployment callback error:",
//             error
//         );

//         return res.status(500).json({
//             message:
//                 "Unable to update deployment",
//             error:
//                 error.message
//         });
//     }
// };


// module.exports = {
//     githubWebhook,
//     updateDeploymentFromGitHub
// };



const Project = require("../models/Project");
const Deployment = require("../models/Deployment");

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

        const repository =
            req.body.repository?.full_name;

        if (!repository) {
            return res.status(400).json({
                message: "Repository missing"
            });
        }

        const project =
            await Project.findOne({
                githubFullName: repository
            });

        if (!project) {
            return res.status(200).json({
                message:
                    "No DeployX project connected to this repository"
            });
        }

        return res.status(200).json({
            message:
                "GitHub push received"
        });

    } catch (error) {
        console.error(
            "GitHub webhook error:",
            error
        );

        return res.status(500).json({
            message:
                "Webhook failed"
        });
    }
};

// --------------------------------------------------
// GitHub Actions → DeployX callback
// --------------------------------------------------

const updateDeploymentFromGitHub = async (
    req,
    res
) => {
    try {
        // --------------------------------------------------
        // Verify callback secret
        // --------------------------------------------------

        const expectedSecret =
            process.env.DEPLOYX_DEPLOYMENT_SECRET;

        const receivedSecret =
            req.headers["x-deployx-secret"];

        if (
            !expectedSecret ||
            !receivedSecret ||
            receivedSecret !== expectedSecret
        ) {
            return res.status(401).json({
                message:
                    "Invalid deployment callback secret"
            });
        }

        // --------------------------------------------------
        // Read callback data
        // --------------------------------------------------

        const {
            deploymentId,
            status,
            url,
            logs,
            currentStep,
            outputDirectory
        } = req.body || {};

        if (!deploymentId) {
            return res.status(400).json({
                message:
                    "Deployment ID is required"
            });
        }

        // --------------------------------------------------
        // Find deployment
        // --------------------------------------------------

        const deployment =
            await Deployment.findById(
                deploymentId
            );

        if (!deployment) {
            return res.status(404).json({
                message:
                    "Deployment not found"
            });
        }

        // --------------------------------------------------
        // Find project
        // --------------------------------------------------

        const project =
            await Project.findById(
                deployment.project
            );

        if (!project) {
            return res.status(404).json({
                message:
                    "Project not found"
            });
        }

        // --------------------------------------------------
        // Update logs
        // --------------------------------------------------

        if (
            typeof logs === "string" &&
            logs.length > 0
        ) {
            deployment.logs =
                `${deployment.logs || ""}${logs}`;
        }

        // --------------------------------------------------
        // Update step
        // --------------------------------------------------

        if (currentStep) {
            deployment.currentStep =
                currentStep;
        }

        // --------------------------------------------------
        // Update output directory
        // --------------------------------------------------

        if (outputDirectory) {
            deployment.outputDirectory =
                outputDirectory;
        }

        // --------------------------------------------------
        // Update URL
        // --------------------------------------------------

        if (typeof url === "string") {
            deployment.url =
                url.trim();
        }

        // --------------------------------------------------
        // Update status
        // --------------------------------------------------

        if (
            [
                "queued",
                "building",
                "success",
                "failed"
            ].includes(status)
        ) {
            deployment.status = status;
        }

        // --------------------------------------------------
        // Mark production deployment
        // --------------------------------------------------

        if (
            status === "success" &&
            deployment.url
        ) {
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

            deployment.isProduction =
                true;

            project.productionDeployment =
                deployment._id;

            await project.save();
        }

        await deployment.save();

        // --------------------------------------------------
        // Emit real-time update
        // --------------------------------------------------

        try {
            const { getIO } =
                require("../socket");

            const io = getIO();

            if (io) {
                const deploymentData = {
                    deploymentId:
                        deployment._id.toString(),

                    projectId:
                        deployment.project.toString(),

                    log:
                        logs || "",

                    currentStep:
                        deployment.currentStep,

                    status:
                        deployment.status,

                    url:
                        deployment.url || null
                };

                io
                    .to(
                        deployment._id.toString()
                    )
                    .emit(
                        "deployment-log",
                        deploymentData
                    );

                io
                    .to(
                        `project:${deployment.project.toString()}`
                    )
                    .emit(
                        "deployment-update",
                        deploymentData
                    );
            }

        } catch (socketError) {
            console.error(
                "Deployment socket update failed:",
                socketError
            );
        }

        return res.status(200).json({
            message:
                "Deployment updated successfully",

            deployment: {
                id:
                    deployment._id,

                status:
                    deployment.status,

                currentStep:
                    deployment.currentStep,

                url:
                    deployment.url || null
            }
        });

    } catch (error) {
        console.error(
            "GitHub deployment callback error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to update deployment",

            error:
                error.message
        });
    }
};

module.exports = {
    githubWebhook,
    updateDeploymentFromGitHub
};
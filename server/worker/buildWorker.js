const Deployment = require("../models/Deployment");
const processDeployment = require("../services/deploymentService");
const connectDB = require("../config/db");

require("dotenv").config();

let workerRunning = false;

const poll = async () => {
    if (workerRunning) {
        return;
    }

    workerRunning = true;

    try {
        // Find the oldest queued deployment.
        const deployment = await Deployment.findOne({
            status: "queued"
        }).sort({
            createdAt: 1
        });

        if (!deployment) {
            return;
        }

        console.log(
            `Worker picked deployment ${deployment._id}`
        );

        // IMPORTANT:
        // Claim the deployment before processing it.
        const claimedDeployment =
            await Deployment.findOneAndUpdate(
                {
                    _id: deployment._id,
                    status: "queued"
                },
                {
                    $set: {
                        status: "building",
                        currentStep: "Starting Build"
                    }
                },
                {
                    new: true
                }
            );

        // Another worker/process may have claimed it.
        if (!claimedDeployment) {
            return;
        }

        console.log(
            `Processing deployment ${claimedDeployment._id}`
        );

        await processDeployment(
            claimedDeployment._id
        );

    } catch (error) {
        console.error(
            "Build worker error:",
            error
        );
    } finally {
        workerRunning = false;
    }
};

const startWorker = async () => {
    try {
        await connectDB();

        console.log(
            "DeployX Build Worker started."
        );

        // Check immediately.
        await poll();

        // Then check every 5 seconds.
        setInterval(
            poll,
            5000
        );

    } catch (error) {
        console.error(
            "Unable to start build worker:",
            error
        );

        process.exit(1);
    }
};

startWorker();
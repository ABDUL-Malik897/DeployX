const mongoose = require("mongoose");

const deploymentSchema =  new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        repository: {
            type: String,
            default: ""
        },
        branch: {
            type: String,
            default: "main"
        },
        applicationDirectory: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: [
                "queued",
                "building",
                "success",
                "failed"
            ],
            default: "queued"
        },
        isProduction: {
            type: Boolean,
            default: false
        },
        logs: {
            type: String,
            default: ""
        },
        url: {
            type: String,
            default: ""
        },
        outputDirectory: {
            type: String,
            default: ""
        },
        currentStep: {
            type: String,
            default: "Queued"
        },
    },{ timestamps:true }
);

module.exports = mongoose.model("Deployment",deploymentSchema);
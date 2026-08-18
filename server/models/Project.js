const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        name:{
            type:String,
            required:true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        productionDeployment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Deployment",
            default: null
        },
        repository:{
            type:String,
            required:true
        },
        rootDirectory: {
            type: String,
            default: ""
        },
        framework:{
            type:String,
            default:"Unknown"
        },
        buildCommand:{
            type:String,
            default:"npm run build"
        },
        outputDirectory:{
            type:String,
            default:"dist"
        },
        environmentVariables: [
            {
                key: {
                    type: String,
                    required: true
                },
                value: {
                    type: String,
                    required: true
                },
                _id: false
            }
        ],
        githubFullName: {
            type: String,
            default: ""
        },
        customDomains: [
            {
                domain: {
                    type: String,
                    lowercase: true,
                    trim: true,
                    required: true
                },
                verified: {
                    type: Boolean,
                    default: false
                },
                verificationToken: {
                    type: String,
                    default: ""
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                },
            }
        ],
    },{ timestamps:true }
);

module.exports = mongoose.model("Project",projectSchema);
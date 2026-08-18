const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            default: null
        },
        avatar: {
            type: String,
            default: null
        },
        authProvider: {
            type: String,
            enum: ["local", "google", "github"],
            default: "local"
        },
        googleId: {
            type: String,
            default: null
        },
        githubId: {
            type: String,
            default: null
        },
        githubUsername: {
            type: String,
            default: null
        },
        githubAccessToken: {
            type: String,
            default: null,
            select: false
        },
        githubInstallationId: {
            type: String,
            default: null
        },
        preferences: {
            theme: {
                type: String,
                enum: ["dark", "light", "system"],
                default: "dark"
            },
            notifications: {
                deploymentSuccess: {
                    type: Boolean,
                    default: true
                },
                deploymentFailure: {
                    type: Boolean,
                    default: true
                },
                deploymentStarted: {
                    type: Boolean,
                    default: false
                },
                projectActivity: {
                    type: Boolean,
                    default: true
                }
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
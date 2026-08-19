const bcrypt = require("bcrypt");
const validator = require("validator");
const User = require("../models/User");
const createToken = require("../utils/createToken");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client();
const githubApp = require("../utils/github");
const crypto = require("crypto");

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({
                message: "Invalid email"
            });
        }

        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({
                message:
                    "Password must contain uppercase, lowercase, number and symbol"
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const user = await User.create({
            name,
            email,
            password: hash,
            authProvider: "local"
        });
        const token = createToken(user._id);

        res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                authProvider: user.authProvider
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        if (!user.password) {
            return res.status(400).json({
                message: `Please sign in using ${user.authProvider}`
            });
        }

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        const token = createToken(user._id);

        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                authProvider: user.authProvider
            },
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({
                message: "Google credential required"
            });
        }
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;
        if (!email_verified) {
            return res.status(401).json({
                message: "Google email is not verified"
            });
        }
        let user = await User.findOne({
            $or: [
                { googleId },
                { email }
            ]
        });
        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                avatar: picture,
                authProvider: "google"
            });
        } else if (!user.googleId) {
            user.googleId = googleId;
            if (!user.avatar) {
                user.avatar = picture;
            }
            await user.save();
        }
        const token = createToken(user._id);
        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                authProvider: user.authProvider
            },
            token
        });
    } catch (error) {
        console.error("Google login error:", error);
        res.status(401).json({
            message: "Google authentication failed"
        });
    }
};

const getMe = async (req, res) => {
    try {
        res.status(200).json({
            user: req.user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to get user details"
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, email, avatar } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (user.authProvider === "google" || user.authProvider === "github") {
            if (name !== undefined || email !== undefined) {
                return res.status(403).json({
                    message:`Name and email cannot be changed for ${user.authProvider} accounts.`
                });
            }
        }
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    message: "Name cannot be empty"
                });
            }
            user.name = name.trim();
        }
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return res.status(409).json({
                    message: "Email is already in use"
                });
            }
            user.email = normalizedEmail;
        }
        if (avatar !== undefined) {
            user.avatar = avatar;
        }
        await user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                authProvider: user.authProvider
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update profile"
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (!user.password) {
            return res.status(400).json({
                message:"Password cannot be changed for this account"
            });
        }
        const bcrypt = require("bcrypt");
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect"
            });
        }
        const samePassword = await bcrypt.compare(newPassword, user.password);
        if (samePassword) {
            return res.status(400).json({
                message: "New password must be different from current password"
            });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.status(200).json({
            message: "Password changed successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to change password"
        });
    }
};

const updatePreferences = async (req, res) => {
    try {
        const { theme } = req.body;

        const allowedThemes = [
            "dark",
            "light",
            "system"
        ];

        if (!allowedThemes.includes(theme)) {
            return res.status(400).json({
                message: "Invalid theme"
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        user.preferences.theme = theme;
        await user.save();

        res.status(200).json({
            message: "Preferences updated successfully",
            preferences: user.preferences
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update preferences"
        });
    }
};

const updateNotifications = async (req, res) => {
    try {
        const { deploymentSuccess, deploymentFailure, deploymentStarted, projectActivity } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (!user.preferences) {
            user.preferences = {};
        }
        if (!user.preferences.notifications) {
            user.preferences.notifications = {};
        }
        if (deploymentSuccess !== undefined) {
            user.preferences.notifications.deploymentSuccess = deploymentSuccess;
        }
        if (deploymentFailure !== undefined) {
            user.preferences.notifications.deploymentFailure = deploymentFailure;
        }
        if (deploymentStarted !== undefined) {
            user.preferences.notifications.deploymentStarted = deploymentStarted;
        }
        if (projectActivity !== undefined) {
            user.preferences.notifications.projectActivity = projectActivity;
        }
        await user.save();
        res.status(200).json({
            message: "Notification preferences updated successfully",
            notifications: user.preferences.notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update notification preferences"
        });
    }
};

const connectGithub = async (req, res) => {

    try {
        const { installationId } = req.body;

        if (!installationId) {
            return res.status(400).json({
                message: "GitHub installation ID is required"
            });
        }

        const installation = await githubApp.octokit.request(
                "GET /app/installations/{installation_id}",
                {
                    installation_id: installationId
                }
            );

        const githubAccount = installation.data.account;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        user.githubId = String(githubAccount.id);
        user.githubUsername = githubAccount.login;
        user.githubInstallationId = String(installationId);
        await user.save();
        res.status(200).json({
            message: "GitHub connected successfully",
            github: {
                id: user.githubId,
                username: user.githubUsername,
                installationId: user.githubInstallationId
            }
        });
    } catch (error) {
        console.error("GitHub connection error:", error);
        res.status(500).json({
            message: "Unable to connect GitHub"
        });
    }
};

const githubLogin = (req, res) => {
    const state = crypto.randomBytes(32).toString("hex");

    res.setHeader(
        "Set-Cookie",
        `github_oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600`
    );

    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
        scope: "read:user user:email repo",
        state
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

const githubCallback = async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code || !state) {
            return res.redirect(
                `${process.env.FRONTEND_URL}/login?error=github_auth_failed`
            );
        }
        const cookies = req.headers.cookie || "";
        const stateCookie = cookies
            .split(";")
            .map(cookie => cookie.trim())
            .find(cookie =>
                cookie.startsWith("github_oauth_state=")
            );
        const savedState = stateCookie?.split("=")[1];
        if (!savedState || savedState !== state) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_state_invalid`);
        }

        const tokenResponse = await fetch("https://github.com/login/oauth/access_token",  {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: process.env.GITHUB_CALLBACK_URL
                })
            }
        );
        const tokenData = await tokenResponse.json();
        if (!tokenData.access_token) {
            console.error("GitHub token error:", tokenData);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_token_failed`);
        }

        const githubAccessToken = tokenData.access_token;
        const githubUserResponse = await fetch("https://api.github.com/user", {
            headers: {
                    Accept: "application/vnd.github+json",
                    Authorization: `Bearer ${githubAccessToken}`,
                    "X-GitHub-Api-Version": "2026-03-10"
                }
            }
        );
        const githubUser = await githubUserResponse.json();
        if (!githubUser.id) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_user_failed`);
        }

        const emailResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
                    Accept:"application/vnd.github+json",
                    Authorization: `Bearer ${githubAccessToken}`,
                    "X-GitHub-Api-Version": "2026-03-10"
                }
            }
        );
        const emails = await emailResponse.json();
        const primaryEmail = Array.isArray(emails) ? emails.find(email => email.primary && email.verified) : null;
        if (!primaryEmail?.email) {
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_email_failed`);
        }
        const githubId = String(githubUser.id);
        const email = primaryEmail.email.toLowerCase();
        const name = githubUser.name || githubUser.login;
        const avatar = githubUser.avatar_url;
        let user = await User.findOne({
            $or: [
                { githubId },
                { email }
            ]
        });
        if (!user) {
            user = await User.create({
                name,
                email,
                avatar,
                githubId,
                githubUsername: githubUser.login,
                githubAccessToken,
                authProvider: "github"
            });
        } else {
            user.githubId = githubId;
            user.githubUsername = githubUser.login;
            user.githubAccessToken = githubAccessToken;
            if (!user.avatar) {
                user.avatar = avatar;
            }
            await user.save();
        }
        const token = createToken(user._id);
        const frontendUrl = `${process.env.FRONTEND_URL}/github/callback#token=${encodeURIComponent(token)}`;
        res.setHeader(
            "Set-Cookie",
            "github_oauth_state=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
        );
        return res.redirect(frontendUrl);
    } catch (error) {
        console.error("GitHub OAuth error:", error);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=github_auth_failed`);
    }
};

module.exports = {
    signup,
    login,
    googleLogin,
    getMe,
    updateProfile,
    changePassword,
    updatePreferences,
    updateNotifications,
    connectGithub,
    githubLogin,
    githubCallback
};
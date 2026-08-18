const User = require("../models/User");
const githubApp = require("../utils/github");

const getRepositories = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (!user.githubInstallationId) {
            return res.status(400).json({
                message: "GitHub is not connected"
            });
        }
        const installationId = user.githubInstallationId;
        const installationAuthentication = await githubApp.getInstallationOctokit(installationId);
        const response = await installationAuthentication.request(
            "GET /installation/repositories",
            {
                per_page: 100
            }
        );
        const repositories = response.data.repositories.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            private: repo.private,
            defaultBranch: repo.default_branch,
            htmlUrl: repo.html_url,
            owner: repo.owner.login
        }));
        res.status(200).json({
            repositories
        });
    } catch (error) {
        console.error("GitHub repositories error:", error);
        res.status(500).json({
            message:"Unable to fetch GitHub repositories"
        });
    }
};

const getBranches = async (req, res) => {
    try {
        const { owner, repo } = req.params;
        if (!owner || !repo) {
            return res.status(400).json({
                message: "Repository information is required"
            });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (!user.githubInstallationId) {
            return res.status(400).json({
                message: "GitHub is not connected"
            });
        }
        const octokit = await githubApp.getInstallationOctokit(user.githubInstallationId);
        const response = await octokit.request(
            "GET /repos/{owner}/{repo}/branches",
            {
                owner,
                repo,
                per_page: 100
            }
        );
        const branches = response.data.map((branch) => ({
            name: branch.name,
            protected: branch.protected
        }));
        res.status(200).json({branches});
    } catch (error) {
        console.error("GitHub branches error:", error);
        res.status(500).json({
            message: "Unable to fetch GitHub branches"
        });
    }
};

const inspectRepository = async (req, res) => {
    try {
        const { owner, repo, branch } = req.params;
        if (!owner || !repo) {
            return res.status(400).json({
                message:"Repository information is required"
            });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (!user.githubInstallationId) {
            return res.status(400).json({
                message: "GitHub is not connected"
            });
        }
        const octokit = await githubApp.getInstallationOctokit(user.githubInstallationId);
        const repositoryResponse = await octokit.request(
            "GET /repos/{owner}/{repo}",
            {
                owner,
                repo
            }
        );
        const defaultBranch = repositoryResponse.data.default_branch;
        const selectedBranch = branch || defaultBranch;
        const rootResponse = await octokit.request(
            "GET /repos/{owner}/{repo}/contents/{path}",
            {
                owner,
                repo,
                path: "",
                ref: selectedBranch
            }
        );
        const rootContents = Array.isArray(rootResponse.data) ? rootResponse.data : [];
        const rootFiles = rootContents.filter(item => item.type === "file").map(item => item.name);
        const rootDirectories = rootContents.filter(item => item.type === "dir").map(item => item.name);
        const hasPackageJson = rootFiles.includes("package.json");
        const hasIndexHtml = rootFiles.includes("index.html");
        const applications = [];
        if (hasPackageJson || hasIndexHtml) {
            applications.push({
                directory: "",
                label: "/",
                type: hasPackageJson ? "application" : "static",
                hasPackageJson,
                hasIndexHtml
            });
        }
        for (const directory of rootDirectories) {
            try {
                const directoryResponse = await octokit.request(
                    "GET /repos/{owner}/{repo}/contents/{path}",
                    {
                        owner,
                        repo,
                        path: directory,
                        ref: selectedBranch
                    }
                );
                const contents = Array.isArray(directoryResponse.data) ? directoryResponse.data : [];
                const files = contents.filter(item => item.type === "file").map(item => item.name);
                const hasDirectoryPackageJson = files.includes("package.json");
                const hasDirectoryIndexHtml = files.includes("index.html");
                if (hasDirectoryPackageJson || hasDirectoryIndexHtml) {
                    applications.push({
                        directory,
                        label: directory,
                        type: hasDirectoryPackageJson ? "application" : "static",
                        hasPackageJson: hasDirectoryPackageJson,
                        hasIndexHtml: hasDirectoryIndexHtml
                    });
                }
            } catch (directoryError) {
                console.warn(`Unable to inspect directory ${directory}:`, directoryError.message);
            }
        }
        let repositoryType = "unknown";
        if (applications.length === 0) {
            repositoryType = "unknown";
        }
        else if (applications.length === 1 && applications[0].directory === "") {
            repositoryType = applications[0].type === "static" ? "static" : "application";
        }
        else {
            repositoryType = "monorepo";
        }
        return res.status(200).json({
            repository: {
                owner,
                name: repo,
                branch: selectedBranch,
                defaultBranch
            },
            repositoryType,
            root: {
                files: rootFiles,
                directories: rootDirectories,
                hasPackageJson,
                hasIndexHtml
            },
            applications
        });
    } catch (error) {
        console.error("GitHub repository inspection error:", error);
        return res.status(500).json({
            message:"Unable to inspect GitHub repository"
        });
    }
};

module.exports = {
    getRepositories,
    getBranches,
    inspectRepository
};
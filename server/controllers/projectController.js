const Project = require("../models/Project");
const crypto = require("crypto");
const dns = require("dns").promises;

const createUniqueSlug = async (name) => {
    const baseSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await Project.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
};

const createProject = async (req, res) => {
    try {
        const { name, repository, framework, buildCommand,  outputDirectory, rootDirectory } = req.body;
        if (!name || !repository) {
            return res.status(400).json({
                message: "Project name and repository are required"
            });
        }
        const slug = await createUniqueSlug(name);
        let githubFullName = "";
        try {
            const url = new URL(repository);
            if (url.hostname === "github.com") {
                githubFullName = url.pathname
                    .replace(/^\/|\/$/g, "")
                    .replace(/\.git$/, "");
            }
        } catch (error) {
            return res.status(400).json({
                message: "Invalid repository URL"
            });
        }
        const project = await Project.create({
            owner: req.user._id,
            name,
            slug,
            repository,
            rootDirectory: rootDirectory?.trim() || "",
            githubFullName,
            framework: framework || "Unknown",
            buildCommand: buildCommand || "npm run build",
            outputDirectory: outputDirectory || "dist"
        });
        res.status(201).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to create project"
        });
    }
};

const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({
            owner: req.user._id
        }).sort({ createdAt: -1 });
        for (const project of projects) {
            if (!project.slug) {
                project.slug = await createUniqueSlug(project.name);
                await project.save();
            }
            if (!project.githubFullName && project.repository) {
                try {
                    const url = new URL(project.repository);
                    if (url.hostname === "github.com") {
                        project.githubFullName = url.pathname.replace(/^\/|\/$/g, "").replace(/\.git$/, "");
                        await project.save();
                    }
                } catch (error) {
                    console.error(
                        "Unable to determine GitHub repository:",
                        project.repository
                    );
                }
            }
        }
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to fetch projects"
        });
    }
};

const getProject = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to fetch project"
        });
    }
};

const updateEnvironmentVariables = async (req, res) => {
    try {
        const { environmentVariables } = req.body;
        if (!Array.isArray(environmentVariables)) {
            return res.status(400).json({
                message: "Environment variables must be an array"
            });
        }
        const cleanedVariables = environmentVariables.filter(item => item.key?.trim() && item.value !== undefined)
        .map(item => ({
            key: item.key.trim(),
            value: String(item.value)
        }));
        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id
            },
            {
                environmentVariables: cleanedVariables
            },
            {
                new: true,
                runValidators: true
            }
        );
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        res.status(200).json({
            message: "Environment variables updated",
            project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update environment variables"
        });
    }
};

const updateProject = async (req, res) => {
    try {
        const { name, repository, framework, buildCommand, outputDirectory, rootDirectory } = req.body;
        if (!name || !repository) {
            return res.status(400).json({
                message: "Project name and repository are required"
            });
        }
        let githubFullName = "";
        try {
            const url = new URL(repository);
            if (url.hostname !== "github.com") {
                return res.status(400).json({
                    message: "Repository must be a GitHub URL"
                });
            }
            githubFullName = url.pathname.replace(/^\/|\/$/g, "").replace(/\.git$/, "");
        } catch (error) {
            return res.status(400).json({
                message: "Invalid repository URL"
            });
        }
        const project = await Project.findOneAndUpdate(
            {
                _id: req.params.id,
                owner: req.user._id
            },
            {
                name: name.trim(),
                repository: repository.trim(),
                githubFullName,
                framework: framework || "Unknown",
                buildCommand: buildCommand || "npm run build",
                outputDirectory: outputDirectory || "dist",
                rootDirectory: rootDirectory?.trim() || ""
            },
            {
                new: true,
                runValidators: true
            }
        );
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        res.status(200).json({
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update project"
        });
    }
};

const deleteProject = async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
                _id: req.params.id,
                owner: req.user._id
            });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        res.status(200).json({
            message: "Project deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to delete project"
        });
    }
};

const addCustomDomain = async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain || !domain.trim()) {
            return res.status(400).json({
                message: "Domain is required"
            });
        }
        const cleanedDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "");
        const domainRegex = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
        if (!domainRegex.test(cleanedDomain)) {
            return res.status(400).json({
                message: "Invalid domain name"
            });
        }
        const existingProject = await Project.findOne({
            "customDomains.domain": cleanedDomain
        });
        if (existingProject) {
            return res.status(409).json({
                message: "This domain is already connected to a project"
            });
        }
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        const verificationToken = `deployx-verification-${crypto.randomBytes(16).toString("hex")}`;
        project.customDomains.push({
            domain: cleanedDomain,
            verified: false,
            verificationToken
        });
        await project.save();
        return res.status(201).json({
            message: "Custom domain added",
            domain: cleanedDomain,
            verified: false,
            verification: {
                type: "TXT",
                name: "_deployx",
                value: verificationToken
            }
        });
    } catch (error) {
        console.error("Add custom domain error:", error);
        return res.status(500).json({
            message: "Unable to add custom domain"
        });
    }
};

const verifyCustomDomain = async (req, res) => {
    try {
        const domain = req.params.domain.trim().toLowerCase();
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        const customDomain = project.customDomains.find(item =>  item.domain === domain);
        if (!customDomain) {
            return res.status(404).json({
                message: "Custom domain not found"
            });
        }
        if (customDomain.verified) {
            return res.status(200).json({
                message: "Domain is already verified",
                verified: true,
                domain
            });
        }
        if (process.env.NODE_ENV !== "production" && domain.endsWith(".test")) {
            customDomain.verified = true;
            await project.save();
            return res.status(200).json({
                message: "Local development domain verified successfully",
                verified: true,
                domain
            });
        }
        const expectedToken = customDomain.verificationToken;
        if (!expectedToken) {
            return res.status(400).json({
                message: "Verification token not found",
                verified: false
            });
        }
        let records;
        try {
            records = await dns.resolveTxt(domain);
        } catch (dnsError) {
            console.error("DNS lookup failed:", dnsError);
            return res.status(400).json({
                message:"TXT verification record was not found. Please check your DNS settings and try again.",
                verified: false
            });
        }
        const txtRecords = records.flat();
        const verified = txtRecords.includes(expectedToken);
        if (!verified) {
            return res.status(400).json({
                message: "Verification TXT record does not match.",
                verified: false
            });
        }
        customDomain.verified = true;
        await project.save();
        return res.status(200).json({
            message: "Custom domain verified successfully",
            verified: true,
            domain
        });
    } catch (error) {
        console.error("Verify custom domain error:", error);
        return res.status(500).json({
            message: "Unable to verify custom domain",
            verified: false
        });
    }
};

const getCustomDomains = async (req, res) => {
    try {
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        const domains = (project.customDomains || []).map(item => ({
            domain: item.domain,
            verified: item.verified,
            createdAt: item.createdAt,
            verification: item.verified ? null : {
                type: "TXT",
                name: "_deployx",
                value: item.verificationToken
            }
        }));
        return res.status(200).json({ domains });
    } catch (error) {
        console.error("Get custom domains error:", error);
        return res.status(500).json({
            message: "Unable to fetch custom domains"
        });
    }
};

const deleteCustomDomain = async (req, res) => {
    try {
        const domain = req.params.domain.trim().toLowerCase();
        const project = await Project.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                message: "Project not found"
            });
        }
        const originalLength = project.customDomains.length;
        project.customDomains = project.customDomains.filter(item => item.domain !== domain);
        if (project.customDomains.length === originalLength) {
            return res.status(404).json({
                message: "Custom domain not found"
            });
        }
        await project.save();
        return res.status(200).json({
            message: "Custom domain removed",
            domains: project.customDomains
        });
    } catch (error) {
        console.error("Delete custom domain error:",  error);
        return res.status(500).json({
            message:"Unable to remove custom domain"
        });
    }
};

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateEnvironmentVariables,
    updateProject,
    deleteProject,
    addCustomDomain,
    getCustomDomains,
    deleteCustomDomain,
    verifyCustomDomain
};
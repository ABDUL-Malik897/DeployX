const githubApp = require("./github");

const triggerBuildWorkflow = async ({ installationId, owner, repo, branch, rootDirectory = "", deploymentId, outputDirectory = "dist", projectSlug }) => {

    if (!installationId) {
        throw new Error("GitHub installation ID is required");
    }
    if (!owner || !repo) {
        throw new Error("GitHub repository owner and name are required");
    }
    if (!branch) {
        throw new Error("GitHub branch is required");
    }
    if (!deploymentId) {
        throw new Error("Deployment ID is required");
    }
    if (!projectSlug) {
        throw new Error("Project slug is required");
    }

    const octokit = await githubApp.getInstallationOctokit(installationId);
    const workflowOwner = process.env.DEPLOYX_WORKFLOW_OWNER || "ABDUL-Malik897";
    const workflowRepo = process.env.DEPLOYX_WORKFLOW_REPO || "DeployX";
    const workflowRef = process.env.DEPLOYX_WORKFLOW_REF || "main";

    const response = await octokit.request("POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
        {
            owner: workflowOwner,
            repo: workflowRepo,
            workflow_id: "deployx-build.yml",
            ref: workflowRef,
            inputs: {
                owner,
                repo,
                branch,
                root_directory: rootDirectory || "",
                deployment_id: deploymentId,
                output_directory: outputDirectory || "dist",
                project_slug: projectSlug
            }
        }
    );
    return response;
};

module.exports = {
    triggerBuildWorkflow
};
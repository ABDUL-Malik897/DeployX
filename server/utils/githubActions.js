const githubApp = require("./github");

const triggerBuildWorkflow = async ({
    installationId,
    owner,
    repo,
    branch,
    rootDirectory = "",
    deploymentId,
    outputDirectory = "dist",
    projectSlug
}) => {

    if (!installationId) {
        throw new Error(
            "GitHub installation ID is required"
        );
    }

    if (!owner || !repo) {
        throw new Error(
            "GitHub repository owner and name are required"
        );
    }

    if (!branch) {
        throw new Error(
            "GitHub branch is required"
        );
    }

    if (!deploymentId) {
        throw new Error(
            "Deployment ID is required"
        );
    }

    if (!projectSlug) {
        throw new Error(
            "Project slug is required"
        );
    }

    const octokit =
        await githubApp.getInstallationOctokit(
            installationId
        );

    // ----------------------------------------
    // DeployX workflow repository
    // ----------------------------------------

    const workflowOwner =
        process.env.DEPLOYX_WORKFLOW_OWNER ||
        "ABDUL-Malik897";

    const workflowRepo =
        process.env.DEPLOYX_WORKFLOW_REPO ||
        "DeployX";

    const workflowRef =
        process.env.DEPLOYX_WORKFLOW_REF ||
        "main";

    // ----------------------------------------
    // Trigger GitHub Actions workflow
    // ----------------------------------------

    const response =
        await octokit.request(
            "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
            {
                owner: workflowOwner,
                repo: workflowRepo,

                workflow_id:
                    "deployx-build.yml",

                // Branch containing the
                // DeployX workflow.
                ref: workflowRef,

                inputs: {
                    // Target repository
                    owner,

                    repo,

                    // Target branch
                    branch,

                    // Directory inside target repo
                    root_directory:
                        rootDirectory || "",

                    // MongoDB Deployment document
                    deployment_id:
                        deploymentId,

                    // Build output directory
                    output_directory:
                        outputDirectory || "dist",

                    // DeployX project slug
                    project_slug:
                        projectSlug
                }
            }
        );

    return response;
};

module.exports = {
    triggerBuildWorkflow
};
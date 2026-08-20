const githubApp = require("./github");

const triggerBuildWorkflow = async ({
    installationId,
    owner,
    repo,
    branch,
    rootDirectory = ""
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

    const octokit =
        await githubApp.getInstallationOctokit(
            installationId
        );

    // The DeployX workflow lives in the DeployX repository.
    const workflowOwner =
        process.env.DEPLOYX_WORKFLOW_OWNER ||
        "ABDUL-Malik897";

    const workflowRepo =
        process.env.DEPLOYX_WORKFLOW_REPO ||
        "DeployX";

    const workflowRef =
        process.env.DEPLOYX_WORKFLOW_REF ||
        "main";

    const response =
        await octokit.request(
            "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
            {
                owner: workflowOwner,
                repo: workflowRepo,
                workflow_id: "deployx-build.yml",

                // Branch of the DeployX repository
                // containing the workflow.
                ref: workflowRef,

                // Repository that DeployX wants
                // GitHub Actions to build.
                inputs: {
                    owner,
                    repo,
                    branch,
                    root_directory:
                        rootDirectory || ""
                }
            }
        );

    return response;
};

module.exports = {
    triggerBuildWorkflow
};
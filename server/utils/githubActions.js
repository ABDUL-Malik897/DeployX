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

    const response = await octokit.request(
        "POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
        {
            owner,
            repo,
            workflow_id: "deployx-build.yml",
            ref: branch,
            inputs: {
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
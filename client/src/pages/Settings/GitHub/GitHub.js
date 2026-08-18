import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../../../api/api";
import useAuthContext from "../../../hooks/useAuthContext";
import "./GitHub.css";
// import LoadingState from "../../../components/LoadingState/LoadingState";
import ErrorState from "../../../components/ErrorState/ErrorState";

const GitHub = () => {

    const [searchParams,setSearchParams] = useSearchParams();
    const {user, dispatch} = useAuthContext();
    const installationHandled = useRef(false);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    const [repositories, setRepositories] = useState([]);
    const [repositoriesLoading, setRepositoriesLoading] = useState(false);
    const [repositoriesError, setRepositoriesError] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedRepository, setSelectedRepository] = useState(null);
    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [branchesError, setBranchesError] = useState("");
    const [deployingBranch, setDeployingBranch] = useState("");
    const [deploymentError, setDeploymentError] = useState("");
    const [inspection, setInspection] = useState(null);
    const [inspectionLoading, setInspectionLoading] = useState(false);
    const [inspectionError, setInspectionError] = useState("");
    const [selectedRootDirectory, setSelectedRootDirectory] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const currentUser = user?.user || user;

    const fetchRepositories = useCallback(async () => {
        try {
            setRepositoriesLoading(true);
            setRepositoriesError("");
            const response = await API.get("/github/repositories");
            setRepositories(response.data.repositories || []);
        } catch (error) {
            console.error(error);
            setRepositoriesError(error.response?.data?.message || "Unable to load repositories.");
        } finally {
            setRepositoriesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser?.githubInstallationId) {
            setConnected(true);
            fetchRepositories();
        }
    }, [currentUser,fetchRepositories]);

    const connectInstallation = useCallback(async (installationId) => {
        try {
            setConnecting(true);
            setError("");
            setSuccess("");
            const response = await API.post("/auth/github/connect", {installationId});
            setConnected(true);
            fetchRepositories();
            setSuccess(response.data.message || "GitHub connected successfully.");
            const updatedUser = {
                ...currentUser,
                githubId: response.data.github.id,
                githubUsername: response.data.github.username,
                githubInstallationId: response.data.github.installationId
            };
            dispatch({
                type: "UPDATE_USER",
                payload: updatedUser
            });
            localStorage.setItem("user", JSON.stringify(updatedUser));
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to connect GitHub.");
        } finally {
            setConnecting(false);
        }
    },[currentUser, dispatch, fetchRepositories]);

    useEffect(() => {
        const installationId = searchParams.get("installation_id");
        const setupAction = searchParams.get("setup_action");
        if (!installationId || setupAction !== "install" || installationHandled.current) {
            return;
        }
        installationHandled.current = true;
        setSearchParams({}, {replace: true});
        connectInstallation(installationId);
    }, [connectInstallation, searchParams, setSearchParams]);

    const handleConnect = () => {
        window.location.href = "https://github.com/apps/deployx-platform/installations/new";
    };

    const fetchBranches = async (repository) => {
        try {
            setSelectedRepository(repository);
            setBranchesLoading(true);
            setBranchesError("");
            setBranches([]);
            setInspection(null);
            setInspectionError("");
            setSelectedBranch("");
            setSelectedRootDirectory("");
            const response = await API.get(`/github/repositories/${repository.owner}/${repository.name}/branches`);
            setBranches(response.data.branches || []);
        } catch (error) {
            console.error(error);
            setBranchesError(error.response?.data?.message || "Unable to load branches.");
        } finally {
            setBranchesLoading(false);
        }
    };

    const inspectRepository = async (branch) => {
        if (!selectedRepository) {
            return;
        }
        try {
            setInspectionLoading(true);
            setInspectionError("");
            setDeploymentError("");
            setSuccess("");
            setInspection(null);
            setSelectedBranch(branch);
            setSelectedRootDirectory("");
            const response = await API.get(`/github/repositories/${selectedRepository.owner}/${selectedRepository.name}/inspect/${encodeURIComponent(branch)}`);
            const data = response.data;
            setInspection(data);
            const applications = data.applications || [];
            if (applications.length === 1) {
                setSelectedRootDirectory(applications[0].directory || "");
            }
            if (applications.length > 1) {
                const rootApplication = applications.find(application => !application.directory);
                if (rootApplication) {
                    setSelectedRootDirectory("");
                }
            }
        } catch (error) {
            console.error("Repository inspection error:", error);
            setInspectionError(error.response?.data?.message || "Unable to inspect repository.");
        } finally {
            setInspectionLoading(false);
        }
    };

    const handleDeploy = async (branch, rootDirectory = "") => {
        try {
            if (!selectedRepository) {
                return;
            }
            setDeployingBranch(branch);
            setDeploymentError("");
            setSuccess("");
            console.log("Deploy clicked:", selectedRepository.fullName, branch, rootDirectory);
            const response = await API.get("/projects");
            const projects = response.data;
            const githubFullName = selectedRepository.fullName?.trim().toLowerCase();
            const githubUrl = selectedRepository.htmlUrl?.trim().toLowerCase().replace(/\/$/,"");
            let project = projects.find((project) => {
                const projectFullName = project.githubFullName?.trim().toLowerCase();
                const projectUrl = project.repository?.trim().toLowerCase().replace(/\/$/, "");
                return (projectFullName === githubFullName || projectUrl === githubUrl);
            });
            console.log("Existing DeployX project:", project);
            if (!project) {
            console.log("No DeployX project found.");
            console.log("Creating project for:", selectedRepository.fullName);
            const repositoryUrl = selectedRepository.htmlUrl;
            const createResponse = await API.post("/projects",
                {
                name: selectedRepository.name,
                repository: repositoryUrl,
                rootDirectory: rootDirectory
                }
            );
                project = createResponse.data;
                console.log("DeployX project created:", project);
            }
            else {
                const updateResponse = await API.put(`/projects/${project._id}`,
                    {
                        name: project.name,
                        repository: project.repository,
                        framework: project.framework,
                        buildCommand: project.buildCommand,
                        outputDirectory: project.outputDirectory,
                        rootDirectory: rootDirectory
                    }
                );
                project = updateResponse.data.project || updateResponse.data;
            }
            const deploymentResponse = await API.post(`/deployments/${project._id}`,
                {
                    branch,
                    rootDirectory
                }
            );
            console.log("Deployment response:", deploymentResponse.data);
            setSuccess(`Deployment of ${branch} started successfully.`);
            setInspection(null);
            setSelectedBranch("");
            setSelectedRootDirectory("");
        } catch (error) {
            console.error("Deployment error:", error);
            setDeploymentError(error.response?.data?.message || error.response?.data?.error || error.message || "Unable to start deployment.");
        } finally {
            setDeployingBranch("");
        }
    };

    const closeRepository = () => {
        setSelectedRepository(null);
        setBranches([]);
        setBranchesError("");
        setInspection(null);
        setInspectionError("");
        setSelectedBranch("");
        setSelectedRootDirectory("");
        setDeploymentError("");
    };

    return (
        <div className="github-settings">
            <div className="settings-section-header">
                <h2>GitHub</h2>
                <p>
                    Connect GitHub to import repositories and deploy your projects.
                </p>
            </div>
            <div className="github-card">
                <div className="github-card-icon">GitHub</div>
                <div className="github-card-content">
                    <h3>
                        {connected
                            ? "GitHub connected"
                            : "Connect GitHub"
                        }
                    </h3>
                    {connected ? (
                        <>
                            <p>
                                Your GitHub account is connected to DeployX.
                            </p>
                            {currentUser?.githubUsername && (
                                <span className="github-username">
                                    @
                                    {currentUser.githubUsername}
                                </span>
                            )}
                        </>
                    ) : (
                        <p>
                            Connect your GitHub account to give DeployX access to your repositories.
                        </p>
                    )}
                </div>
                {!connected && (
                    <button
                        type="button"
                        className="github-connect-button"
                        onClick={handleConnect}
                        disabled={connecting}
                    >
                        {connecting
                            ? "Connecting..."
                            : "Connect GitHub"
                        }
                    </button>
                )}
            </div>
            {connected && (
                <div className="github-repositories">
                    <div className="github-repositories-header">
                        <div>
                            <h3>
                                Your Repositories
                            </h3>
                            <p>
                                Repositories available to DeployX.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={
                                fetchRepositories
                            }
                            disabled={
                                repositoriesLoading
                            }
                        >
                            {repositoriesLoading
                                ? "Refreshing..."
                                : "Refresh"
                            }
                        </button>
                    </div>
                    {repositoriesLoading && (
                        <p className="github-repositories-status">
                            Loading repositories...
                        </p>
                    )}
                    {repositoriesError && (
                        <p className="github-error">
                            {repositoriesError}
                        </p>
                    )}
                    {!repositoriesLoading &&
                        !repositoriesError &&
                        repositories.length === 0 && (
                            <p className="github-repositories-status">
                                No repositories available.
                            </p>
                        )
                    }
                    {selectedRepository && (
                        <div className="branches-section">
                            <div className="branches-header">
                                <div>
                                    <h3>
                                        {selectedRepository.name}
                                    </h3>
                                    <p>
                                        {selectedRepository.fullName}
                                    </p>
                                    <span className="branches-label">
                                        Branches
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={
                                        closeRepository
                                    }
                                >
                                    Close
                                </button>
                            </div>
                            {branchesLoading && (
                                <p className="github-repositories-status">
                                    Loading branches...
                                </p>
                            )}
                            {branchesError && (
                                <p className="github-error">
                                    {branchesError}
                                </p>
                            )}
                            {!branchesLoading &&
                                !branchesError &&
                                branches.length === 0 && (
                                    <p className="github-repositories-status">
                                        No branches found.
                                    </p>
                                )
                            }
                            {!branchesLoading &&
                                !branchesError &&
                                branches.length > 0 && (
                                    <div className="branch-list">
                                        {branches.map(
                                            (branch) => (
                                                <div
                                                    key={
                                                        branch.name
                                                    }
                                                    className="branch-item"
                                                >
                                                    <div className="branch-info">
                                                        <strong>
                                                            {branch.name}
                                                        </strong>
                                                        {branch.protected && (
                                                            <span className="protected-branch">
                                                                Protected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="branch-deploy-button"
                                                        onClick={() =>
                                                            inspectRepository(
                                                                branch.name
                                                            )
                                                        }
                                                        disabled={
                                                            inspectionLoading &&
                                                            selectedBranch ===
                                                                branch.name
                                                        }
                                                    >
                                                        {inspectionLoading &&
                                                        selectedBranch ===
                                                            branch.name
                                                            ? "Inspecting..."
                                                            : "Configure"
                                                        }
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )
                            }
                            {inspection && (
                                <div className="repository-inspection">
                                    <div className="inspection-header">
                                        <h3>
                                            Configure Deployment
                                        </h3>
                                        <p>
                                            Choose which directory in this repository should be deployed.
                                        </p>
                                    </div>
                                    <div className="inspection-info">
                                        <div>
                                            <span>
                                                Repository
                                            </span>
                                            <strong>
                                                {selectedRepository.fullName}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>
                                                Branch
                                            </span>
                                            <strong>
                                                {selectedBranch}
                                            </strong>
                                        </div>
                                        <div>
                                            <span>
                                                Repository Type
                                            </span>
                                            <strong>
                                                {inspection.repositoryType || "Unknown"}
                                            </strong>
                                        </div>
                                    </div>
                                    {inspectionError && (
                                        <p className="github-error">
                                            {inspectionError}
                                        </p>
                                    )}
                                    {!inspectionError &&
                                        inspection.applications?.length > 0 && (
                                            <div className="root-directory-selector">
                                                <label>
                                                    Root Directory
                                                </label>
                                                <select
                                                    value={
                                                        selectedRootDirectory
                                                    }
                                                    onChange={(event) =>
                                                        setSelectedRootDirectory(
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    {inspection.applications.map(
                                                        (
                                                            application
                                                        ) => (
                                                            <option
                                                                key={
                                                                    application.directory ||
                                                                    "root"
                                                                }
                                                                value={
                                                                    application.directory ||
                                                                    ""
                                                                }
                                                            >
                                                                {application.directory ||
                                                                    "/"}
                                                                {" — "}
                                                                {
                                                                    application.type
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                <small>Leave this as / to deploy from the repository root.
                                                    For a monorepo, choose the frontend directory.
                                                </small>
                                            </div>
                                        )
                                    }
                                    {!inspectionError &&
                                        (
                                            !inspection.applications ||
                                            inspection.applications.length === 0
                                        ) && (
                                            <p className="github-error">
                                                No deployable application was detected in this repository.
                                            </p>
                                        )
                                    }
                                    {!inspectionError &&
                                        inspection.applications?.length > 0 && (
                                            <button
                                                type="button"
                                                className="branch-deploy-button"
                                                onClick={() =>
                                                    handleDeploy(
                                                        selectedBranch,
                                                        selectedRootDirectory
                                                    )
                                                }
                                                disabled={
                                                    !!deployingBranch
                                                }
                                            >
                                                {deployingBranch
                                                    ? "Deploying..."
                                                    : "Deploy"
                                                }
                                            </button>
                                        )
                                    }
                                </div>
                            )}
                        </div>
                    )}
                    {!repositoriesLoading &&
                        repositories.length > 0 && (
                            <div className="repository-list">
                                {repositories
                                    .filter(
                                        (repository) =>
                                            repository.id !==
                                            selectedRepository?.id
                                    )
                                    .map(
                                        (repository) => (
                                            <button
                                                type="button"
                                                key={
                                                    repository.id
                                                }
                                                className="repository-item"
                                                onClick={() =>
                                                    fetchBranches(
                                                        repository
                                                    )
                                                }
                                            >
                                                <div className="repository-info">
                                                    <h4>
                                                        {
                                                            repository.name
                                                        }
                                                    </h4>
                                                    <p>
                                                        {
                                                            repository.fullName
                                                        }
                                                    </p>
                                                </div>
                                                <span className="repository-branch">
                                                    {
                                                        repository.defaultBranch
                                                    }
                                                </span>
                                            </button>
                                        )
                                    )}
                            </div>
                        )}
                </div>
            )}
            {success && (
                <p className="github-success">
                    {success}
                </p>
            )}
            {error && (
                <p className="github-error">
                    <ErrorState message={error}/>
                </p>
            )}
            {deploymentError && (
                <p className="github-error">
                    {deploymentError}
                </p>
            )}
        </div>
    );
};


export default GitHub;
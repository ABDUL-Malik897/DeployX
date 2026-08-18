import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import API from "../../api/api";
import LoadingState from "../../components/LoadingState/LoadingState";
import ErrorState from "../../components/ErrorState/ErrorState";
import "./ProjectDetails.css";
import socket from "../../socket/socket";

const ProjectDetails = () => {

    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [deployments, setDeployments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [error, setError] = useState("");
    const [envVars, setEnvVars] = useState([
        {
            key: "",
            value: ""
        }
    ]);
    const [savingEnv, setSavingEnv] = useState(false);
    const [envError, setEnvError] = useState("");
    const [showValues, setShowValues] = useState({});

    const fetchProject = useCallback(async () => {
        try {
            const response = await API.get(
                `/projects/${id}`
            );
            setProject(response.data);
            if (response.data.environmentVariables?.length) {
                setEnvVars(
                    response.data.environmentVariables
                );
            }
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message ||  "Unable to load project");
        }
    }, [id]);

    const fetchDeployments = useCallback(async () => {
        try {
            const response = await API.get(`/deployments/project/${id}`);
            setDeployments(response.data);
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    useEffect(() => {
        const loadProject = async () => {
            setLoading(true);
            await Promise.all([
                fetchProject(),
                fetchDeployments()
            ]);
            setLoading(false);
        };
        loadProject();
    }, [fetchProject,fetchDeployments]);

    useEffect(() => {
        if (!id) {
            return;
        }
        socket.emit("join-project", id);

        const handleDeploymentUpdate = (data) => {
            if (!data?.deploymentId) {
                return;
            }
            setDeployments(prev => {
                const existingIndex = prev.findIndex(deployment => deployment._id === data.deploymentId);
                if (existingIndex === -1) {
                    const newDeployment = {
                        _id: data.deploymentId,
                        project: id,
                        status: data.status || "queued",
                        currentStep:
                            data.currentStep ||
                            "Deployment queued...",
                        logs: data.log || "",
                        url: data.url || null,
                        createdAt:
                            data.createdAt ||
                            new Date().toISOString()
                    };
                    return [
                        newDeployment,
                        ...prev
                    ];
                }
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    status: data.status ?? updated[existingIndex].status,
                    currentStep: data.currentStep ?? updated[existingIndex].currentStep,
                    url: data.url ?? updated[existingIndex].url,
                    logs: data.log ? (updated[existingIndex].logs || "") + data.log : updated[existingIndex].logs
                };
                return updated;
            });
        };
        socket.on("deployment-update", handleDeploymentUpdate);

        return () => {
            socket.off("deployment-update", handleDeploymentUpdate);
        };
    }, [id]);

    const handleDeploy = async () => {
        if (!project) {
            return;
        }
        try {
            setDeploying(true);
            setError("");
            const response = await API.post(`/deployments/${project._id}`);
            const deployment = response.data.deployment || response.data;
            setDeployments(prev => {
                const exists = prev.some(
                    item => item._id === deployment._id
                );
                if (exists) {
                    return prev;
                }
                return [
                    deployment,
                    ...prev
                ];
            });
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || error.response?.data?.error || "Unable to start deployment");
            await fetchDeployments();
        } finally {
            setDeploying(false);
        }
    };

    if (loading) {
        return (
            <>
                <LoadingState
                    message="Loading project..."
                />
            </>
        );
    }

    if (error && !project) {
        return (
            <>
                <ErrorState
                    message={error}
                    onRetry={fetchProject}
                />
            </>
        );
    }

    const addEnvironmentVariable = () => {
        setEnvVars(prev => [
            ...prev,
            {
                key: "",
                value: ""
            }
        ]);
    };

    const updateEnvironmentVariable = (index, field, value) => {
        setEnvVars(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return updated;
        });
    };

    const removeEnvironmentVariable = (index) => {
        setEnvVars(prev => prev.filter((_, i) => i !== index));
    };

    const toggleEnvironmentValue = (index) => {
        setShowValues(prev => ({
            ...prev,
            [index]: !prev[index]
        }));

    };

    const saveEnvironmentVariables = async () => {
        try {
            setSavingEnv(true);
            setEnvError("");
            const response = await API.put(
                `/projects/${id}/environment`,
                {
                    environmentVariables: envVars
                }
            );
            setProject(response.data.project);
        } catch (error) {
            console.error(error);
            setEnvError(error.response?.data?.message || "Unable to save environment variables");
        } finally {
            setSavingEnv(false);
        }
    };

    return (
        <>
            <Link
                to="/dashboard"
                className="back-link"
            >
                ← Back to Dashboard
            </Link>
            <div className="project-details-header">
                <div>
                    <p className="project-label">
                        PROJECT
                    </p>
                    <h1>
                        {project.name}
                    </h1>
                    <a
                        href={project.repository}
                        target="_blank"
                        rel="noreferrer"
                        className="repository-link"
                    >
                        {project.repository}
                    </a>
                </div>
                <button
                    className="deploy-button"
                    onClick={handleDeploy}
                    disabled={deploying}
                >
                    {deploying
                        ? "Deploying..."
                        : "🚀 Deploy"
                    }
                </button>
            </div>
            {error && (
                <p className="project-error">
                    {error}
                </p>
            )}
            <section className="project-info-grid">
                <div className="project-info-card">
                    <span>
                        Framework
                    </span>
                    <strong>
                        {project.framework || "Not detected"}
                    </strong>
                </div>
                <div className="project-info-card">
                    <span>
                        Build Command
                    </span>
                    <strong>
                        {project.buildCommand || "Not configured"}
                    </strong>
                </div>
                <div className="project-info-card">
                    <span>
                        Output Directory
                    </span>
                    <strong>
                        {project.outputDirectory || "Not configured"}
                    </strong>
                </div>
                <div className="project-info-card">
                    <span>
                        Root Directory
                    </span>
                    <strong>
                        {project.rootDirectory || "/"}
                    </strong>
                </div>
                <div className="project-info-card">
                    <span>
                        Created
                    </span>
                    <strong>
                        {project.createdAt
                            ? new Date(
                                project.createdAt
                            ).toLocaleDateString()
                            : "Unknown"
                        }
                    </strong>
                </div>
            </section>
            <section className="environment-section">
                <div className="environment-header">
                    <div>
                        <h2>
                            Environment Variables
                        </h2>
                        <p>
                            Variables required during your project build.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="add-variable-button"
                        onClick={addEnvironmentVariable}
                    >
                        + Add Variable
                    </button>
                </div>
                <div className="environment-list">
                    {envVars.map((variable, index) => (
                        <div
                            className="environment-row"
                            key={index}
                        >
                            <input
                                type="text"
                                placeholder="KEY"
                                value={variable.key}
                                onChange={(e) =>
                                    updateEnvironmentVariable(
                                        index,
                                        "key",
                                        e.target.value
                                    )
                                }
                            />
                            <div className="environment-value">
                                <input
                                    type={
                                        showValues[index]
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="VALUE"
                                    value={variable.value}
                                    onChange={(e) =>
                                        updateEnvironmentVariable(
                                            index,
                                            "value",
                                            e.target.value
                                        )
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleEnvironmentValue(index)
                                    }
                                >
                                    {showValues[index]
                                        ? "Hide"
                                        : "Show"
                                    }
                                </button>
                            </div>
                            <button
                                type="button"
                                className="remove-variable-button"
                                onClick={() =>
                                    removeEnvironmentVariable(index)
                                }
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
                {envError && (
                    <p className="environment-error">
                        {envError}
                    </p>
                )}
                <button
                    type="button"
                    className="save-environment-button"
                    onClick={saveEnvironmentVariables}
                    disabled={savingEnv}
                >
                    {savingEnv
                        ? "Saving..."
                        : "Save Variables"
                    }
                </button>
            </section>
            <section className="deployments-section">
                <div className="section-header">
                    <div>
                        <h2>
                            Deployments
                        </h2>
                        <p>
                            Deployment history for this project.
                        </p>
                    </div>
                    <span>
                        {deployments.length} deployments
                    </span>
                </div>
                {deployments.length === 0 ? (
                    <div className="empty-deployments">
                        <div>
                            🚀
                        </div>
                        <h3>
                            No deployments yet
                        </h3>
                        <p>
                            Deploy this project to get started.
                        </p>
                    </div>
                ) : (
                    <div className="deployment-list">
                        {deployments.map((deployment) => (
                            <div
                                className="deployment-card"
                                key={deployment._id}
                            >
                                <div>
                                    <StatusBadge
                                        status={deployment.status}
                                    />
                                    <p>
                                        {deployment.currentStep ||
                                            "No current step"
                                        }
                                    </p>
                                    <span>
                                        {deployment.createdAt
                                            ? new Date(
                                                deployment.createdAt
                                            ).toLocaleString()
                                            : ""
                                        }
                                    </span>
                                </div>
                                <div className="deployment-actions">
                                    {deployment.status === "success" &&
                                        deployment.url && (
                                            <a
                                                href={deployment.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Visit →
                                            </a>
                                        )}
                                    <Link
                                        to={`/deployments/${deployment._id}`}
                                    >
                                        View Logs →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default ProjectDetails;
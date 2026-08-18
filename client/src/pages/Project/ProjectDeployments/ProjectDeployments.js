import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../../api/api";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import LoadingState from "../../../components/LoadingState/LoadingState";
import ErrorState from "../../../components/ErrorState/ErrorState";
import ProjectTabs from "../../../components/ProjectTabs/ProjectTabs";
import socket from "../../../socket/socket";
import "./ProjectDeployments.css";

const ProjectDeployments = () => {

    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [deployments, setDeployments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deploying, setDeploying] = useState(false);
    const [deployError, setDeployError] = useState("");

    const fetchProject = useCallback(async () => {
        try {
            const response = await API.get(`/projects/${id}`);
            setProject(response.data);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to load project.");
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
        const load = async () => {
            setLoading(true);
            await Promise.all([
                fetchProject(),
                fetchDeployments()
            ]);
            setLoading(false);
        };
        load();
    }, [fetchProject, fetchDeployments]);

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
                        currentStep: data.currentStep || "Deployment queued...",
                        logs: data.log || "",
                        url: data.url || null,
                        createdAt: data.createdAt || new Date().toISOString()
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
        try {
            setDeploying(true);
            setDeployError("");
            const response = await API.post(`/deployments/${id}`);
            const deployment = response.data.deployment || response.data;
            setDeployments(prev => {
                const exists = prev.some(item => item._id === deployment._id);
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
            setDeployError(error.response?.data?.message || error.response?.data?.error || "Unable to start deployment.");
            await fetchDeployments();
        } finally {
            setDeploying(false);
        }
    };

    if (loading) {
        return (
            <LoadingState
                message="Loading deployments..."
            />
        );
    }

    if (error && !project) {
        return (
            <ErrorState
                message={error}
                onRetry={fetchProject}
            />
        );
    }

    return (
        <div className="project-deployments">
            <Link
                to={`/projects/${id}`}
                className="project-deployments-back"
            >
                ← {project?.name || "Project"}
            </Link>
            <div className="project-deployments-header">
                <div>
                    <h1>
                        {project?.name}
                    </h1>
                    <p>
                        Deployment history for this project.
                    </p>
                </div>
                <button
                    type="button"
                    className="project-deployments-button"
                    onClick={handleDeploy}
                    disabled={deploying}
                >
                    {deploying
                        ? "Deploying..."
                        : "🚀 Deploy"
                    }
                </button>
            </div>
            <ProjectTabs />
            {deployError && (
                <p className="project-deployments-error">
                    {deployError}
                </p>
            )}
            <section className="deployments-content">
                <div className="deployments-content-header">
                    <div>
                        <h2>
                            Deployments
                        </h2>
                        <p>
                            All deployments for this project.
                        </p>
                    </div>
                    <span>
                        {deployments.length} deployments
                    </span>
                </div>
                {deployments.length === 0 ? (
                    <div className="deployments-empty">
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
                    <div className="deployments-list">
                        {deployments.map((deployment) => (
                            <div
                                className="deployment-item"
                                key={deployment._id}
                            >
                                <div className="deployment-item-main">
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
                                <div className="deployment-item-actions">
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
        </div>
    );
};

export default ProjectDeployments;
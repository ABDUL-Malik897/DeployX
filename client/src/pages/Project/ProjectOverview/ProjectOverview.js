import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../../api/api";
import ProjectTabs from "../../../components/ProjectTabs/ProjectTabs";
import "./ProjectOverview.css";
import socket from "../../../socket/socket";
import LoadingState from "../../../components/LoadingState/LoadingState";
import ErrorState from "../../../components/ErrorState/ErrorState";

const ProjectOverview = () => {

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
    },[id])

    const fetchDeployments = useCallback(async () => {
        try {
            const response = await API.get(`/deployments/project/${id}`);
            setDeployments(response.data);
        } catch (error) {
            console.error(error);
        }
    },[id])

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
    }, [fetchDeployments,fetchProject]);

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
                        currentStep:  data.currentStep || "Deployment queued...",
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
        if (!project) {
            return;
        }
        try {
            setDeploying(true);
            setDeployError("");
            const response = await API.post(`/deployments/${project._id}`);
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
        } finally {
            setDeploying(false);
        }
    };

    if (loading) {
        return (
            <div className="project-overview-message">
                <LoadingState message="Loading project..."/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-overview-error">
                <ErrorState message={error}/>
            </div>
        );
    }

    if (!project) return null;

    const latestDeployment = deployments.length > 0 ? deployments[0] : null;

    return (
        <div className="project-overview">
            <Link
                to="/projects"
                className="project-back"
            >
                ← Projects
            </Link>
            <div className="project-header">
                <div className="project-header-info">
                    <div className="project-title-row">
                        <h1>
                            {project.name}
                        </h1>
                        <span className="project-status">
                            ● Ready
                        </span>
                    </div>
                    <a
                        href={project.repository}
                        target="_blank"
                        rel="noreferrer"
                        className="project-repository"
                    >
                        {project.repository}
                    </a>
                </div>
                <button
                    type="button"
                    className="project-deploy-button"
                    onClick={handleDeploy}
                    disabled={deploying}
                >
                    {deploying
                        ? "Deploying..."
                        : "Deploy"
                    }
                </button>
            </div>
            <ProjectTabs />
            {deployError && (
                <p className="project-deploy-error">
                    {deployError}
                </p>
            )}
            <section className="project-overview-section">
                <div className="project-section-heading">
                    <div>
                        <h2>
                            Production
                        </h2>
                        <p>
                            Your latest deployment.
                        </p>
                    </div>
                </div>
                {latestDeployment ? (
                    <div className="latest-deployment-card">
                        <div>
                            <span className="deployment-branch">
                                {latestDeployment.branch || "main"}
                            </span>
                            <h3>
                                {latestDeployment.commitMessage ||
                                    "Latest deployment"}
                            </h3>
                        </div>
                        <div className="latest-deployment-meta">
                            <span>
                                {latestDeployment.status}
                            </span>
                            <Link
                                to={`/deployments/${latestDeployment._id}`}
                            >
                                View Deployment →
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="no-deployment">
                        <div className="no-deployment-icon">
                            🚀
                        </div>
                        <h3>
                            No deployments yet
                        </h3>
                        <p>
                            Deploy this project to see your
                            deployment history here.
                        </p>
                    </div>
                )}
            </section>
            <section className="project-overview-section">
                <div className="project-section-heading">
                    <div>
                        <h2>
                            Project Information
                        </h2>
                        <p>
                            Configuration detected for this project.
                        </p>
                    </div>
                </div>
                <div className="project-info-grid">
                    <div className="project-info-item">
                        <span>
                            Framework
                        </span>
                        <strong>
                            {project.framework || "Not detected"}
                        </strong>
                    </div>
                    <div className="project-info-item">
                        <span>
                            Build Command
                        </span>
                        <strong>
                            {project.buildCommand || "Not configured"}
                        </strong>
                    </div>
                    <div className="project-info-item">
                        <span>
                            Output Directory
                        </span>
                        <strong>
                            {project.outputDirectory || "Not configured"}
                        </strong>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProjectOverview;
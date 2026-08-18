import { useEffect, useState } from "react";
import { BsFolderFill } from "react-icons/bs";
import { GoRocket } from "react-icons/go";
import { GiCheckMark } from "react-icons/gi";
import { FaBoxOpen } from "react-icons/fa";
import API from "../../api/api";
import StatsCard from "../../components/StatsCard/StatsCard";
import ProjectCard from "../../components/ProjectCard/ProjectCard";
import LoadingState from "../../components/LoadingState/LoadingState";
import ErrorState from "../../components/ErrorState/ErrorState";
import EmptyState from "../../components/EmptyState/EmptyState";
import RecentDeployments from "../../components/RecentDeployments/RecentDeployments";
import { validateRepositoryUrl } from "../../utils/validation";
import "./Dashboard.css";

const Dashboard = () => {

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("");
    const [repository, setRepository] = useState("");
    const [rootDirectory, setRootDirectory] = useState("");
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await API.get("/dashboard");
            setDashboard(response.data);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to load dashboard");
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await API.get("/projects");
            setProjects(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProjects()
        fetchDashboard();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setCreateError("");
        if (!name.trim()) {
            setCreateError("Please enter a project name.");
            return;
        }
        if (!validateRepositoryUrl(repository)) {
            setCreateError(
                "Please enter a valid GitHub repository URL."
            );
            return;
        }
        try {
            setCreating(true);
            const response = await API.post("/projects",
                {
                    name,
                    repository,
                    rootDirectory: rootDirectory.trim()
                }
            );
            setProjects(prev => [
                response.data,
                ...prev
            ]);
            await fetchDashboard();
            setName("");
            setRepository("");
            setRootDirectory("");
        } catch (error) {
            console.error(error);
            setCreateError(error.response?.data?.message || error.response?.data?.error || "Unable to create project");
        } finally {
            setCreating(false);
        }
    };

    return (
        <>
            <div className="dashboard-header">
                <div>
                    <h1>
                        Dashboard
                    </h1>
                    <p>
                        Manage your projects and deployments from one place.
                    </p>
                </div>
            </div>
            {loading && (
                <LoadingState
                    message="Loading your dashboard..."
                />
            )}
            {error && (
                <ErrorState
                    message={error}
                    onRetry={fetchDashboard}
                />
            )}
            {!loading && !error && dashboard && (
                <>
                    <div className="stats-container">
                        <StatsCard
                            title="Projects"
                            value={dashboard.totalProjects}
                            icon={<BsFolderFill />}
                        />
                        <StatsCard
                            title="Deployments"
                            value={dashboard.totalDeployments}
                            icon={<GoRocket />}
                        />
                        <StatsCard
                            title="Success Rate"
                            value={`${dashboard.successRate}%`}
                            icon={<GiCheckMark />}
                        />
                    </div>
                    <RecentDeployments />
                    <section className="create-project-section">
                        <div className="create-project-header">
                            <div>
                                <h2>
                                    Create Project
                                </h2>
                                <p>
                                    Connect a GitHub repository to DeployX.
                                </p>
                            </div>
                        </div>
                        <form
                            className="create-project-form"
                            onSubmit={handleCreateProject}
                        >
                            <div className="create-project-field">
                                <label htmlFor="project-name">
                                    Project Name
                                </label>
                                <input
                                    id="project-name"
                                    type="text"
                                    placeholder="My React App"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    maxLength={100}
                                    required
                                />
                            </div>
                            <div className="create-project-field">
                                <label htmlFor="project-root-directory">
                                    Application Directory
                                </label>
                                <input
                                    id="project-root-directory"
                                    type="text"
                                    placeholder="frontend"
                                    value={rootDirectory}
                                    onChange={(e) =>
                                        setRootDirectory(e.target.value)
                                    }
                                />
                                <p className="create-project-field-help">
                                    Leave empty if your application is in the repository root.
                                    For example, enter <strong>frontend</strong> for a project where the frontend contains package.json.
                                </p>
                            </div>
                            <div className="create-project-field">
                                <label htmlFor="project-repository">
                                    GitHub Repository
                                </label>
                                <input
                                    id="project-repository"
                                    type="url"
                                    placeholder="https://github.com/username/project"
                                    value={repository}
                                    onChange={(e) =>
                                        setRepository(e.target.value)
                                    }
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="create-project-button"
                                disabled={creating}
                            >
                                {creating
                                    ? "Creating..."
                                    : "Create Project"
                                }
                            </button>
                        </form>
                        {createError && (
                            <p className="create-project-error">
                                {createError}
                            </p>
                        )}
                    </section>
                    <section className="projects-section">
                        <div className="section-header">
                            <div>
                                <h2>
                                    Your Projects
                                </h2>
                                <p>
                                    Projects connected to DeployX.
                                </p>
                            </div>
                            <span>
                                {projects.length} projects
                            </span>
                        </div>
                        {projects.length === 0 ? (
                            <EmptyState
                                icon={<FaBoxOpen />}
                                title="No projects yet"
                                message="Create your first project to start deploying."
                            />
                        ) : (
                            <div className="projects-grid">
                                {projects.map((project) => (
                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </>
    );
};

export default Dashboard;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import LoadingState from "../../components/LoadingState/LoadingState";
import ErrorState from "../../components/ErrorState/ErrorState";
import EmptyState from "../../components/EmptyState/EmptyState";
import ProjectCard from "../../components/ProjectCard/ProjectCard";
import "./Projects.css";

const Projects = () => {

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await API.get("/projects");
            setProjects(response.data);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to load projects.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (
        <div className="projects-page">
            <div className="projects-page-header">
                <div>
                    <h1>
                        Projects
                    </h1>
                    <p>
                        Manage your projects and deployments.
                    </p>
                </div>
                <Link
                    to="/projects/new"
                    className="projects-create-button"
                >
                    + Add Project
                </Link>
            </div>
            {loading && (
                <LoadingState
                    message="Loading projects..."
                />
            )}
            {error && (
                <ErrorState
                    message={error}
                    onRetry={fetchProjects}
                />
            )}
            {!loading && !error && projects.length === 0 && (
                <EmptyState
                    icon="📦"
                    title="No projects yet"
                    message="Create your first project to start deploying."
                />
            )}
            {!loading && !error && projects.length > 0 && (
                <div className="projects-page-grid">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Projects;
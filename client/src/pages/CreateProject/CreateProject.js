import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { validateRepositoryUrl } from "../../utils/validation";

import "./CreateProject.css";

const CreateProject = () => {

    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [repository, setRepository] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!name.trim()) {
            setError("Please enter a project name.");
            return;
        }
        if (!validateRepositoryUrl(repository)) {
            setError("Please enter a valid GitHub repository URL.");
            return;
        }
        try {
            setLoading(true);
            const response = await API.post("/projects",
                {
                    name: name.trim(),
                    repository: repository.trim()
                }
            );
            navigate(`/projects/${response.data._id}`);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || error.response?.data?.error || "Unable to create project.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-project-page">
            <div className="create-project-page-header">
                <Link
                    to="/projects"
                    className="create-project-back"
                >
                    ← Back to Projects
                </Link>
                <h1>
                    Create a new project
                </h1>
                <p>
                    Connect a GitHub repository to DeployX.
                </p>
            </div>
            <form
                className="create-project-card"
                onSubmit={handleSubmit}
            >
                <div className="create-project-field">
                    <label htmlFor="project-name">
                        Project Name
                    </label>
                    <input
                        id="project-name"
                        type="text"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        placeholder="my-react-app"
                        maxLength={100}
                        required
                    />
                    <small>
                        Choose a name that helps you identify
                        this project.
                    </small>
                </div>
                <div className="create-project-field">
                    <label htmlFor="project-repository">
                        GitHub Repository
                    </label>
                    <input
                        id="project-repository"
                        type="url"
                        value={repository}
                        onChange={(e) =>
                            setRepository(e.target.value)
                        }
                        placeholder="https://github.com/username/project"
                        required
                    />
                    <small>
                        The repository DeployX will use for deployments.
                    </small>
                </div>
                {error && (
                    <p className="create-project-error">
                        {error}
                    </p>
                )}
                <div className="create-project-actions">
                    <Link
                        to="/projects"
                        className="create-project-cancel"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="create-project-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating..."
                            : "Create Project"
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProject;
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../../../api/api";
import ProjectTabs from "../../../components/ProjectTabs/ProjectTabs";
import LoadingState from "../../../components/LoadingState/LoadingState";
import ErrorState from "../../../components/ErrorState/ErrorState";
import "./ProjectEnvironment.css";

const ProjectEnvironment = () => {

    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [envVars, setEnvVars] = useState([
        {
            key: "",
            value: ""
        }
    ]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [showValues, setShowValues] = useState({});

    const fetchProject = useCallback(async () => {
        try {
            const response = await API.get(`/projects/${id}`);
            setProject(response.data);
            if (response.data.environmentVariables?.length) {
                setEnvVars(response.data.environmentVariables);
            }
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to load project.");
        }
    }, [id]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchProject();
            setLoading(false);
        };
        load();
    }, [fetchProject]);

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
        setShowValues(prev => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
        });
    };

    const toggleEnvironmentValue = (index) => {
        setShowValues(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const saveEnvironmentVariables = async () => {
        try {
            setSaving(true);
            setSaveError("");
            const response = await API.put(`/projects/${id}/environment`,
                {
                    environmentVariables: envVars
                }
            );
            setProject(response.data.project);
        } catch (error) {
            console.error(error);
            setSaveError(error.response?.data?.message ||"Unable to save environment variables.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <LoadingState
                message="Loading environment variables..."
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
        <div className="project-environment">
            <Link
                to={`/projects/${id}`}
                className="project-environment-back"
            >
                ← {project?.name || "Project"}
            </Link>
            <div className="project-environment-header">
                <div>
                    <h1>
                        {project?.name}
                    </h1>
                    <p>
                        Manage environment variables used
                        during your project build.
                    </p>
                </div>
            </div>
            <ProjectTabs />
            <section className="environment-settings-card">
                <div className="environment-settings-header">
                    <div>
                        <h2>
                            Environment Variables
                        </h2>
                        <p>
                            These variables are available
                            during your deployments.
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
                {saveError && (
                    <p className="environment-save-error">
                        {saveError}
                    </p>
                )}
                <button
                    type="button"
                    className="save-environment-button"
                    onClick={saveEnvironmentVariables}
                    disabled={saving}
                >
                    {saving
                        ? "Saving..."
                        : "Save Variables"
                    }
                </button>
            </section>
        </div>
    );
};

export default ProjectEnvironment;
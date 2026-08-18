import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../../../api/api";
import ProjectTabs from "../../../components/ProjectTabs/ProjectTabs";
import LoadingState from "../../../components/LoadingState/LoadingState";
import ErrorState from "../../../components/ErrorState/ErrorState";
import "./ProjectSettings.css";

const ProjectSettings = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [name, setName] = useState("");
    const [repository, setRepository] = useState("");
    const [framework, setFramework] = useState("");
    const [buildCommand, setBuildCommand] = useState("");
    const [outputDirectory, setOutputDirectory] = useState("");
    const [rootDirectory, setRootDirectory] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [customDomains, setCustomDomains] = useState([]);
    const [domain, setDomain] = useState("");
    const [domainLoading, setDomainLoading] = useState(false);
    const [domainError, setDomainError] = useState("");
    const [domainSuccess, setDomainSuccess] = useState("");
    const [error, setError] = useState("");
    const [saveError, setSaveError] = useState("");
    const [success, setSuccess] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchProject = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await API.get(`/projects/${id}`);
            const data = response.data;
            setProject(data);
            setName(data.name || "");
            setRepository(data.repository || "");
            setFramework(data.framework || "");
            setBuildCommand(data.buildCommand || "");
            setOutputDirectory(data.outputDirectory || "");
            setRootDirectory(data.rootDirectory || "");
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to load project settings.");
        } finally {
            setLoading(false);
        }
    },[id])

    const fetchCustomDomains = useCallback(async () => {
        try {
            setDomainError("");
            const response = await API.get(`/projects/${id}/domains`);
            setCustomDomains(response.data.domains || []);
        } catch (error) {
            console.error(error);
            setDomainError(error.response?.data?.message || "Unable to load custom domains.");
        }
    }, [id]);

    useEffect(() => {
        fetchProject();
        fetchCustomDomains()
    }, [fetchProject,fetchCustomDomains]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setSaveError("");
            setSuccess("");
            const response = await API.put(`/projects/${id}`,
                {
                    name,
                    repository,
                    framework,
                    buildCommand,
                    outputDirectory,
                    rootDirectory
                }
            );
            setProject(response.data.project);
            setName(response.data.project.name);
            setRepository(response.data.project.repository);
            setFramework(response.data.project.framework);
            setBuildCommand(response.data.project.buildCommand);
            setOutputDirectory(response.data.project.outputDirectory);
            setRootDirectory(response.data.project.rootDirectory || "");
            setSuccess("Project settings saved successfully.");
        } catch (error) {
            console.error(error);
            setSaveError(error.response?.data?.message || "Unable to update project.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await API.delete(`/projects/${id}`);
            navigate("/projects");
        } catch (error) {
            console.error(error);
            setSaveError(error.response?.data?.message || "Unable to delete project.");
            setShowDeleteModal(false);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <LoadingState
                message="Loading project settings..."
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={fetchProject}
            />
        );
    }

    if (!project) return null;    

    const handleAddDomain = async (e) => {
        e.preventDefault();
        if (!domain.trim()) {
            return;
        }
        try {
            setDomainLoading(true);
            setDomainError("");
            setDomainSuccess("");
            const response = await API.post(`/projects/${id}/domains`, { domain });
            const addedDomain = {
                domain: response.data.domain,
                verified: response.data.verified,
                verification: response.data.verification
            };
            setCustomDomains(prev => [
                ...prev,
                addedDomain
            ]);
            setDomain("");
            setDomainSuccess("Custom domain added successfully.");
        } catch (error) {
            console.error(error);
            setDomainError(error.response?.data?.message || "Unable to add custom domain.");
        } finally {
            setDomainLoading(false);
        }
    };

    const handleVerifyDomain = async (domainName) => {
        try {
            setDomainError("");
            setDomainSuccess("");
            const response = await API.post(`/projects/${id}/domains/${encodeURIComponent(domainName)}/verify`);
            setCustomDomains(prev =>
                prev.map(item =>
                    item.domain === domainName
                        ? {
                            ...item,
                            verified:
                                response.data.verified
                        }
                        : item
                )
            );
            setDomainSuccess("Domain verified successfully.");
        } catch (error) {
            console.error(error);
            setDomainError(error.response?.data?.message || "Unable to verify domain.");
        }
    };

    const handleDeleteDomain = async (domainName) => {
        const confirmed = window.confirm(`Remove ${domainName}?`);
        if (!confirmed) {
            return;
        }
        try {
            setDomainError("");
            setDomainSuccess("");
            await API.delete(`/projects/${id}/domains/${encodeURIComponent(domainName)}`);
            setCustomDomains(prev => prev.filter(item => item.domain !== domainName));
            setDomainSuccess("Custom domain removed.");
        } catch (error) {
            console.error(error);
            setDomainError(error.response?.data?.message || "Unable to remove domain.");
        }
    };

    return (
        <div className="project-settings">
            <Link
                to={`/projects/${id}`}
                className="project-settings-back"
            >
                ← {project.name}
            </Link>
            <div className="project-settings-header">
                <h1>
                    Project Settings
                </h1>
                <p>
                    Manage configuration for {project.name}.
                </p>
            </div>
            <ProjectTabs />
            <section className="project-settings-section">
                <div className="project-settings-section-header">
                    <h2>
                        General
                    </h2>
                    <p>
                        Configure your project's basic settings.
                    </p>
                </div>
                <form
                    className="project-settings-form"
                    onSubmit={handleSave}
                >
                    <div className="project-settings-field">
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
                            required
                        />
                    </div>
                    <div className="project-settings-field">
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
                            required
                        />
                    </div>
                    <div className="project-settings-field">
                        <label htmlFor="project-root">
                            Root Directory
                        </label>
                        <input
                            id="project-root"
                            type="text"
                            value={rootDirectory}
                            onChange={(e) =>
                                setRootDirectory(e.target.value)
                            }
                            placeholder="/"
                        />
                        <small>
                            Leave empty to use the repository root.
                            For a monorepo, enter something like
                            <strong> frontend </strong>
                            or
                            <strong> apps/web </strong>.
                        </small>
                    </div>
                    <div className="project-settings-field">
                        <label htmlFor="project-framework">
                            Framework
                        </label>
                        <input
                            id="project-framework"
                            type="text"
                            value={framework}
                            onChange={(e) =>
                                setFramework(e.target.value)
                            }
                        />
                    </div>
                    <div className="project-settings-field">
                        <label htmlFor="project-build">
                            Build Command
                        </label>
                        <input
                            id="project-build"
                            type="text"
                            value={buildCommand}
                            onChange={(e) =>
                                setBuildCommand(e.target.value)
                            }
                        />
                    </div>
                    <div className="project-settings-field">
                        <label htmlFor="project-output">
                            Output Directory
                        </label>
                        <input
                            id="project-output"
                            type="text"
                            value={outputDirectory}
                            onChange={(e) =>
                                setOutputDirectory(e.target.value)
                            }
                        />
                    </div>
                    {saveError && (
                        <p className="project-settings-error">
                            {saveError}
                        </p>
                    )}
                    {success && (
                        <p className="project-settings-success">
                            {success}
                        </p>
                    )}
                    <div className="project-settings-actions">
                        <button
                            type="submit"
                            className="project-settings-save"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"
                            }
                        </button>
                    </div>
                </form>
            </section>
            <section className="project-settings-section">
                <div className="project-settings-section-header">
                    <h2>
                        Custom Domains
                    </h2>
                    <p>
                        Connect a custom domain to your production deployment.
                    </p>
                </div>
                <form
                    className="project-settings-form"
                    onSubmit={handleAddDomain}
                >
                    <div className="project-settings-field">
                        <label htmlFor="custom-domain">
                            Domain
                        </label>
                        <input
                            id="custom-domain"
                            type="text"
                            value={domain}
                            onChange={(e) =>
                                setDomain(e.target.value)
                            }
                            placeholder="example.com"
                        />
                        <small>
                            Enter your domain without http:// or https://.
                        </small>
                    </div>
                    {domainError && (
                        <p className="project-settings-error">
                            {domainError}
                        </p>
                    )}
                    {domainSuccess && (
                        <p className="project-settings-success">
                            {domainSuccess}
                        </p>
                    )}
                    <div className="project-settings-actions">
                        <button
                            type="submit"
                            className="project-settings-save"
                            disabled={domainLoading}
                        >
                            {domainLoading
                                ? "Adding..."
                                : "Add Domain"
                            }
                        </button>
                    </div>
                </form>
                {customDomains.length > 0 && (
                    <div className="custom-domains-list">
                        <h3>
                            Connected Domains
                        </h3>
                        {customDomains.map(
                            item => (
                                <div
                                    className="custom-domain-card"
                                    key={item.domain}
                                >
                                    <div>
                                        <strong>
                                            {item.domain}
                                        </strong>
                                        <span>
                                            {item.verified ? "✓ Verified" : "⚠ Not verified"}
                                        </span>
                                    </div>
                                    <div>
                                        {!item.verified && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleVerifyDomain(
                                                        item.domain
                                                    )
                                                }
                                            >
                                                Verify
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleDeleteDomain(
                                                    item.domain
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    {!item.verified &&
                                        item.verification && (
                                        <div className="domain-verification">
                                            <p>
                                                Add this DNS TXT record:
                                            </p>
                                            <div>
                                                <strong>
                                                    Type:
                                                </strong>
                                                <span>
                                                    {
                                                        item.verification.type
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Name:
                                                </strong>
                                                <span>
                                                    {
                                                        item.verification.name
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Value:
                                                </strong>
                                                <code>
                                                    {
                                                        item.verification.value
                                                    }
                                                </code>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}
            </section>
            <section className="project-settings-section danger-zone">
                <div className="project-settings-section-header">
                    <h2>
                        Danger Zone
                    </h2>
                    <p>
                        These actions can permanently affect your project.
                    </p>
                </div>
                <div className="danger-action">
                    <div>
                        <h3>
                            Delete Project
                        </h3>
                        <p>
                            Permanently delete this project.
                            This action cannot be undone.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="danger-delete-button"
                        onClick={() =>
                            setShowDeleteModal(true)
                        }
                    >
                        Delete Project
                    </button>
                </div>
            </section>
            {showDeleteModal && (
                <div className="delete-modal-overlay">
                    <div className="delete-modal">
                        <h2>
                            Delete project?
                        </h2>
                        <p>
                            This will permanently delete
                            <strong> {project.name}</strong>.
                            This action cannot be undone.
                        </p>
                        <div className="delete-modal-actions">
                            <button
                                type="button"
                                className="delete-cancel-button"
                                onClick={() =>
                                    setShowDeleteModal(false)
                                }
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="delete-confirm-button"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Yes, Delete Project"
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectSettings;
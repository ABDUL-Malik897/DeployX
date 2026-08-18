import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import LoadingState from "../../components/LoadingState/LoadingState";
import ErrorState from "../../components/ErrorState/ErrorState";
import "./Deployments.css";

const Deployments = () => {

    const [deployments, setDeployments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchDeployments = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await API.get("/deployments");
            setDeployments(response.data);
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Unable to load deployments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeployments();
    }, []);

    if (loading) {
        return (
            <LoadingState
                message="Loading deployments..."
            />
        );
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={fetchDeployments}
            />
        );
    }

    return (
        <div className="deployments-page">
            <div className="deployments-page-header">
                <div>
                    <h1>
                        Deployments
                    </h1>
                    <p>
                        View and manage all your deployments.
                    </p>
                </div>
            </div>
            {deployments.length === 0 ? (
                <div className="deployments-page-empty">
                    <div className="deployments-empty-icon">
                        🚀
                    </div>
                    <h2>
                        No deployments yet
                    </h2>
                    <p>
                        Deploy one of your projects to see deployment activity here.
                    </p>
                    <Link
                        to="/dashboard"
                        className="deployments-empty-button"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            ) : (
                <section className="deployments-table-card">
                    <div className="deployments-table-header">
                        <span>
                            Deployment
                        </span>
                        <span>
                            Project
                        </span>
                        <span>
                            Status
                        </span>
                        <span>
                            Created
                        </span>
                        <span>
                            Action
                        </span>
                    </div>
                    <div className="deployments-table-body">
                        {deployments.map((deployment) => (
                            <div
                                className="deployment-table-row"
                                key={deployment._id}
                            >
                                <div>
                                    <strong>
                                        {deployment.currentStep ||
                                            "Deployment"
                                        }
                                    </strong>
                                    <small>
                                        {deployment._id}
                                    </small>
                                </div>
                                <div>
                                    <Link
                                        to={`/projects/${deployment.project?._id}`}
                                    >
                                        {deployment.project?.name ||
                                            "Unknown Project"
                                        }
                                    </Link>
                                </div>
                                <div>
                                    <StatusBadge
                                        status={deployment.status}
                                    />
                                </div>
                                <div>
                                    <span className="deployment-date">
                                        {deployment.createdAt
                                            ? new Date(
                                                deployment.createdAt
                                            ).toLocaleString()
                                            : "Unknown"
                                        }
                                    </span>
                                </div>
                                <div>
                                    <Link
                                        to={`/deployments/${deployment._id}`}
                                        className="deployment-view-link"
                                    >
                                        View →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Deployments;
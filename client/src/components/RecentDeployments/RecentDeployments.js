import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/api";
import StatusBadge from "../StatusBadge/StatusBadge";
import "./RecentDeployments.css";
import LoadingState from "../LoadingState/LoadingState";

const RecentDeployments = () => {

    const [deployments, setDeployments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeployments = async () => {
            try {
                const response = await API.get("/deployments");
                setDeployments(response.data.slice(0, 5));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDeployments();
    }, []);

    if (loading) {
        return (
            <section className="recent-deployments">
                <div className="recent-deployments-header">
                    <div>
                        <h2>
                            Recent Deployments
                        </h2>
                        <p>
                            Your latest deployment activity.
                        </p>
                    </div>
                </div>
                <LoadingState message="Loading deployments..."/>
            </section>
        );
    }

    return (
        <section className="recent-deployments">
            <div className="recent-deployments-header">
                <div>
                    <h2>
                        Recent Deployments
                    </h2>
                    <p>
                        Your latest deployment activity.
                    </p>
                </div>
                <Link
                    to="/deployments"
                    className="recent-deployments-view-all"
                >
                    View all →
                </Link>
            </div>
            {deployments.length === 0 ? (
                <div className="recent-deployments-empty">
                    <div>
                        🚀
                    </div>
                    <h3>
                        No deployments yet
                    </h3>
                    <p>
                        Deploy a project to see activity here.
                    </p>
                </div>
            ) : (
                <div className="recent-deployments-list">
                    {deployments.map((deployment) => (
                        <div
                            className="recent-deployment-item"
                            key={deployment._id}
                        >
                            <div className="recent-deployment-info">
                                <div className="recent-deployment-title">
                                    <strong>
                                        {deployment.project?.name ||
                                            "Project"
                                        }
                                    </strong>
                                    <StatusBadge
                                        status={deployment.status}
                                    />
                                </div>
                                <p>
                                    {deployment.currentStep || "Deployment"}
                                </p>
                                <span>
                                    {deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : ""}
                                </span>
                            </div>
                            <Link
                                to={`/deployments/${deployment._id}`}
                                className="recent-deployment-link"
                            >
                                View →
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default RecentDeployments;
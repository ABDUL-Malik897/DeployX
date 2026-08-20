import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import API from "../../api/api";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import "./DeploymentDetails.css";

const DeploymentDetails = () => {

    const { id } = useParams();

    const [deployment, setDeployment] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [redeploying, setRedeploying] =
        useState(false);

    const [redeployError, setRedeployError] =
        useState("");

    const [rollingBack, setRollingBack] =
        useState(false);

    const [rollbackError, setRollbackError] =
        useState("");

    const logsRef =
        useRef(null);

    // --------------------------------------------------
    // Load deployment
    // --------------------------------------------------

    useEffect(() => {

        const fetchDeployment =
            async () => {

                try {

                    setLoading(true);
                    setError("");

                    const response =
                        await API.get(
                            `/deployments/details/${id}`
                        );

                    setDeployment(
                        response.data
                    );

                } catch (error) {

                    console.error(
                        "Unable to load deployment:",
                        error
                    );

                    setError(
                        error.response?.data?.message ||
                        "Unable to load deployment"
                    );

                } finally {

                    setLoading(false);
                }
            };

        if (id) {
            fetchDeployment();
        }

    }, [id]);

    // --------------------------------------------------
    // Real-time deployment updates
    // --------------------------------------------------

    useEffect(() => {

        if (!id) {
            return;
        }

        socket.emit(
            "join-deployment",
            id
        );

        const handleDeploymentLog =
            (data) => {

                if (
                    (!data ||
                    data.deploymentId) &&
                    data.deploymentId !== id
                ) {
                    return;
                }

                setDeployment(
                    (previous) => {

                        if (!previous) {
                            return previous;
                        }

                        return {
                            ...previous,

                            logs:
                                data.log
                                    ? (
                                        (previous.logs || "") +
                                        data.log
                                    )
                                    : previous.logs,

                            status:
                                data.status ||
                                previous.status,

                            currentStep:
                                data.currentStep ||
                                previous.currentStep,

                            url:
                                data.url !== undefined
                                    ? data.url
                                    : previous.url
                        };
                    }
                );
            };

        const handleDeploymentUpdate =
            (data) => {

                if (
                    (!data || data.deploymentId) && data.deploymentId !== id
                ) {
                    return;
                }

                setDeployment(
                    (previous) => {

                        if (!previous) {
                            return previous;
                        }

                        return {
                            ...previous,

                            status:
                                data.status ||
                                previous.status,

                            currentStep:
                                data.currentStep ||
                                previous.currentStep,

                            url:
                                data.url !== undefined
                                    ? data.url
                                    : previous.url
                        };
                    }
                );
            };

        socket.on(
            "deployment-log",
            handleDeploymentLog
        );

        socket.on(
            "deployment-update",
            handleDeploymentUpdate
        );

        return () => {

            socket.off(
                "deployment-log",
                handleDeploymentLog
            );

            socket.off(
                "deployment-update",
                handleDeploymentUpdate
            );
        };

    }, [id]);

    // --------------------------------------------------
    // Auto-scroll logs
    // --------------------------------------------------

    useEffect(() => {

        if (logsRef.current) {

            logsRef.current.scrollTop =
                logsRef.current.scrollHeight;
        }

    }, [deployment?.logs]);

    // --------------------------------------------------
    // Redeploy
    // --------------------------------------------------

    const handleRedeploy =
        async () => {

            try {

                setRedeploying(true);
                setRedeployError("");
                setRollbackError("");

                const response =
                    await API.post(
                        `/deployments/${id}/redeploy`
                    );

                const newDeployment =
                    response.data.deployment;

                window.location.href =
                    `/deployments/${newDeployment._id}`;

            } catch (error) {

                console.error(
                    "Redeploy failed:",
                    error
                );

                setRedeployError(
                    error.response?.data?.message ||
                    "Unable to redeploy."
                );

            } finally {

                setRedeploying(false);
            }
        };

    // --------------------------------------------------
    // Rollback
    // --------------------------------------------------

    const handleRollback =
        async () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to rollback to this deployment?"
                );

            if (!confirmed) {
                return;
            }

            try {

                setRollingBack(true);
                setRollbackError("");
                setRedeployError("");

                const response =
                    await API.post(
                        `/deployments/${id}/rollback`
                    );

                setDeployment(
                    response.data.deployment
                );

            } catch (error) {

                console.error(
                    "Rollback failed:",
                    error
                );

                setRollbackError(
                    error.response?.data?.message ||
                    "Unable to rollback."
                );

            } finally {

                setRollingBack(false);
            }
        };

    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    if (loading) {
        return (
            <p className="deployment-message">
                Loading deployment...
            </p>
        );
    }

    // --------------------------------------------------
    // Error
    // --------------------------------------------------

    if (error || !deployment) {
        return (
            <>
                <p className="deployment-error">
                    {error || "Deployment not found"}
                </p>

                <Link
                    to="/dashboard"
                    className="back-link"
                >
                    ← Back to Dashboard
                </Link>
            </>
        );
    }

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
        <>
            <Link
                to={`/projects/${deployment.project?._id}`}
                className="back-link"
            >
                ← Back to Project
            </Link>

            <div className="deployment-details-header">

                <div>

                    <p className="deployment-label">
                        DEPLOYMENT
                    </p>

                    <h1>
                        Deployment Details
                    </h1>

                    <p className="deployment-project-name">
                        {deployment.project?.name}
                    </p>

                </div>

                <div className="deployment-header-actions">

                    <StatusBadge
                        status={
                            deployment.status
                        }
                    />

                    {deployment.status === "success" && (
                        <>
                            <button
                                type="button"
                                className="redeploy-button"
                                onClick={handleRedeploy}
                                disabled={
                                    redeploying ||
                                    rollingBack
                                }
                            >
                                {redeploying
                                    ? "Redeploying..."
                                    : "Redeploy"
                                }
                            </button>

                            <button
                                type="button"
                                className="rollback-button"
                                onClick={handleRollback}
                                disabled={
                                    redeploying ||
                                    rollingBack
                                }
                            >
                                {rollingBack
                                    ? "Rolling back..."
                                    : "Rollback"
                                }
                            </button>
                        </>
                    )}

                </div>
            </div>

            {redeployError && (
                <p className="deployment-error">
                    {redeployError}
                </p>
            )}

            {rollbackError && (
                <p className="deployment-error">
                    {rollbackError}
                </p>
            )}

            <section className="deployment-info-grid">

                <div className="deployment-info-card">

                    <span>
                        Status
                    </span>

                    <StatusBadge
                        status={
                            deployment.status
                        }
                    />

                </div>

                <div className="deployment-info-card">

                    <span>
                        Current Step
                    </span>

                    <strong>
                        {deployment.currentStep ||
                            "No current step"
                        }
                    </strong>

                </div>

                <div className="deployment-info-card">

                    <span>
                        Created
                    </span>

                    <strong>
                        {deployment.createdAt
                            ? new Date(
                                deployment.createdAt
                            ).toLocaleString()
                            : "Unknown"
                        }
                    </strong>

                </div>

                <div className="deployment-info-card">

                    <span>
                        Deployment URL
                    </span>

                    {deployment.url ? (

                        <a
                            href={deployment.url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Visit Deployment →
                        </a>

                    ) : (

                        <strong>
                            Not available
                        </strong>

                    )}

                </div>

            </section>

            <section className="logs-section">

                <div className="logs-header">

                    <div>

                        <h2>
                            Build Logs
                        </h2>

                        <p>
                            Output generated during deployment.
                        </p>

                    </div>

                </div>

                <pre
                    className="logs-container"
                    ref={logsRef}
                >
                    {deployment.logs ||
                        "No logs available."
                    }
                </pre>

            </section>
        </>
    );
};

export default DeploymentDetails;
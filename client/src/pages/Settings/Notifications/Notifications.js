import { useState } from "react";

import API from "../../../api/api";
import useAuthContext from "../../../hooks/useAuthContext";

import "./Notifications.css";
import ErrorState from "../../../components/ErrorState/ErrorState";

const Notifications = () => {

    const { user, dispatch } = useAuthContext();
    const currentUser = user?.user || user;
    const savedNotifications = currentUser?.preferences?.notifications || {};
    const [notifications, setNotifications] = useState({
        deploymentSuccess: savedNotifications.deploymentSuccess ?? true,
        deploymentFailure: savedNotifications.deploymentFailure ?? true,
        deploymentStarted: savedNotifications.deploymentStarted ?? false,
        projectActivity: savedNotifications.projectActivity ?? true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleToggle = async (key) => {
        const updatedNotifications = {
            ...notifications,
            [key]: !notifications[key]
        };
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            const response = await API.put("/auth/notifications", updatedNotifications);
            const savedNotifications = response.data.notifications;
            setNotifications(savedNotifications);
            const updatedUser = {
                ...user,
                preferences: {
                    ...user.preferences,
                    notifications: savedNotifications
                }
            };
            dispatch({
                type: "UPDATE_USER",
                payload: updatedUser
            });
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setSuccess("Notification preferences updated.");
        } catch (error) {
            setError(error.response?.data?.message || "Unable to update notifications.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="notification-settings">
            <div className="settings-section-header">
                <h2>
                    Notifications
                </h2>
                <p>
                    Choose which notifications you want to receive.
                </p>
            </div>
            <div className="notification-list">
                <NotificationItem
                    title="Deployment successful"
                    description="Get notified when a deployment completes successfully."
                    enabled={notifications.deploymentSuccess}
                    disabled={loading}
                    onToggle={() =>
                        handleToggle("deploymentSuccess")
                    }
                />
                <NotificationItem
                    title="Deployment failed"
                    description="Get notified when a deployment fails."
                    enabled={notifications.deploymentFailure}
                    disabled={loading}
                    onToggle={() =>
                        handleToggle("deploymentFailure")
                    }
                />
                <NotificationItem
                    title="Deployment started"
                    description="Get notified whenever a new deployment begins."
                    enabled={notifications.deploymentStarted}
                    disabled={loading}
                    onToggle={() =>
                        handleToggle("deploymentStarted")
                    }
                />
                <NotificationItem
                    title="Project activity"
                    description="Receive updates about activity on your projects."
                    enabled={notifications.projectActivity}
                    disabled={loading}
                    onToggle={() =>
                        handleToggle("projectActivity")
                    }
                />
            </div>
            {error && (
                <p className="notification-error">
                    <ErrorState message={error}/>
                </p>
            )}
            {success && (
                <p className="notification-success">
                    {success}
                </p>
            )}
        </div>
    );
};

const NotificationItem = ({title, description, enabled, disabled, onToggle}) => {

    return (
        <div className="notification-item">
            <div className="notification-info">
                <h3>
                    {title}
                </h3>
                <p>
                    {description}
                </p>
            </div>
            <button
                type="button"
                className={`notification-toggle ${
                    enabled ? "enabled" : ""
                }`}
                onClick={onToggle}
                disabled={disabled}
                aria-label={`Toggle ${title}`}
                aria-pressed={enabled}
            >
                <span />
            </button>
        </div>
    );
};

export default Notifications;
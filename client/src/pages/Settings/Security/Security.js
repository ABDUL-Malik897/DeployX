import { useState } from "react";
import API from "../../../api/api";
import useAuthContext from "../../../hooks/useAuthContext";
import "./Security.css";
import ErrorState from "../../../components/ErrorState/ErrorState";

const Security = () => {

    const { user } = useAuthContext();
    const currentUser = user?.user || user;
    const isOAuthUser = currentUser?.authProvider === "google" || currentUser?.authProvider === "github";
    const providerName = currentUser?.authProvider === "google" ? "Google" : "GitHub";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isOAuthUser) {
            return;
        }
        setError("");
        setSuccess("");
        if (newPassword.length < 6) {
            setError("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        try {
            setLoading(true);

            const response = await API.put("/auth/password",
                {
                    currentPassword,
                    newPassword
                }
            );
            setSuccess(response.data.message || "Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setError(error.response?.data?.message || "Unable to change password.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="security-settings">
            <div className="settings-section-header">
                <h2>
                    Security
                </h2>
                <p>
                    Manage your password and account security.
                </p>
            </div>
            {isOAuthUser ? (
                <div
                    className="security-disabled-container"
                    title={`Password changes are unavailable because you signed in with ${providerName}.`}
                >
                    <div className="security-disabled-message">
                        <span className="security-lock">
                            🔒
                        </span>
                        <div>
                            <strong>
                                Password management is unavailable
                            </strong>
                            <p>
                                You signed in with {providerName}.
                                Your password is managed by {providerName}.
                            </p>
                        </div>
                    </div>
                    <div className="security-field">
                        <label>
                            Current Password
                        </label>
                        <input
                            type="password"
                            disabled
                            placeholder="Unavailable"
                        />
                    </div>
                    <div className="security-field">
                        <label>
                            New Password
                        </label>
                        <input
                            type="password"
                            disabled
                            placeholder="Unavailable"
                        />
                    </div>
                    <div className="security-field">
                        <label>
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            disabled
                            placeholder="Unavailable"
                        />
                    </div>
                    <button
                        type="button"
                        className="security-save-button"
                        disabled
                        title={`You signed in with ${providerName}. Password changes are unavailable.`}
                    >
                        Change Password
                    </button>
                </div>
            ) : (
                <form
                    className="security-form"
                    onSubmit={handleSubmit}
                >
                    <div className="security-field">
                        <label htmlFor="current-password">
                            Current Password
                        </label>
                        <input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) =>
                                setCurrentPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter current password"
                            required
                        />
                    </div>
                    <div className="security-field">
                        <label htmlFor="new-password">
                            New Password
                        </label>
                        <input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div className="security-field">
                        <label htmlFor="confirm-password">
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                    {error && (
                        <p className="security-error">
                            <ErrorState message={error}/>
                        </p>
                    )}
                    {success && (
                        <p className="security-success">
                            {success}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="security-save-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Changing..."
                            : "Change Password"
                        }
                    </button>
                </form>
            )}
        </div>
    );
};

export default Security;
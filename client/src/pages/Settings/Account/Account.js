import { useState } from "react";
import API from "../../../api/api";
import useAuthContext from "../../../hooks/useAuthContext";
import "./Account.css";

const Account = () => {

    const { user, dispatch } = useAuthContext();
    const currentUser = user?.user || user;
    const isOAuthUser = currentUser?.authProvider === "google" || currentUser?.authProvider === "github";
    const providerName = currentUser?.authProvider === "google" ? "Google" : "GitHub";
    const [name, setName] = useState(currentUser?.name || "");
    const [email, setEmail] = useState(currentUser?.email || "");
    const [avatar, setAvatar] = useState(currentUser?.avatar || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            setSuccess("");
            const response = await API.put("/auth/profile",
                isOAuthUser ? { avatar } : {
                    name,
                    email,
                    avatar
                }
            );
            const updatedUser = response.data.user;
            dispatch({
                type: "UPDATE_USER",
                payload: updatedUser
            });
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setSuccess("Profile updated successfully.");
        } catch (error) {
            setError(error.response?.data?.message || "Unable to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="account-settings">
            <div className="settings-section-header">
                <h2>
                    Account
                </h2>
                <p>
                    Manage your personal account information.
                </p>
            </div>
            <form
                className="account-form"
                onSubmit={handleSubmit}
            >
                <div className="account-avatar">
                    {name
                        ? name.charAt(0).toUpperCase()
                        : "A"
                    }
                </div>
                <div className="account-field">
                    <label htmlFor="account-name">
                        Name
                    </label>
                    <input
                        id="account-name"
                        type="text"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        placeholder="Your name"
                        disabled={isOAuthUser}
                        title={
                            isOAuthUser
                                ? `Your name is managed by ${providerName}.`
                                : ""
                        }
                        required={!isOAuthUser}
                    />
                </div>
                <div className="account-field">
                    <label htmlFor="account-email">
                        Email
                    </label>
                    <input
                        id="account-email"
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        placeholder="you@example.com"
                        disabled={isOAuthUser}
                        title={
                            isOAuthUser
                                ? `Your email is managed by ${providerName}.`
                                : ""
                        }
                        required={!isOAuthUser}
                    />
                </div>
                <div className="account-field">
                    <label htmlFor="account-avatar">
                        Avatar URL
                    </label>
                    <input
                        id="account-avatar"
                        type="url"
                        value={avatar}
                        onChange={(e) =>
                            setAvatar(e.target.value)
                        }
                        placeholder="https://..."
                    />
                </div>
                {error && (
                    <p className="account-error">
                        {error}
                    </p>
                )}
                {success && (
                    <p className="account-success">
                        {success}
                    </p>
                )}
                <button
                    type="submit"
                    className="account-save-button"
                    disabled={loading}
                >
                    {loading
                        ? "Saving..."
                        : "Save Changes"
                    }
                </button>
            </form>
        </div>
    );
};

export default Account;
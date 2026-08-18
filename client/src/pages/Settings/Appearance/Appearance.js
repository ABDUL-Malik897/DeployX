import { useEffect, useState } from "react";
import API from "../../../api/api";
import useAuthContext from "../../../hooks/useAuthContext";
import "./Appearance.css";
import ErrorState from "../../../components/ErrorState/ErrorState";

const Appearance = () => {

    const { user, dispatch } = useAuthContext();
    const currentUser = user?.user || user;
    const savedTheme = currentUser?.preferences?.theme || "dark";
    const [theme, setTheme] = useState(savedTheme);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const handleThemeChange = async (selectedTheme) => {
        try {
            setTheme(selectedTheme);
            setLoading(true);
            setError("");
            setSuccess("");
            const response = await API.put("/auth/preferences",
                {
                    theme: selectedTheme
                }
            );
            const updatedPreferences = response.data.preferences;
            const updatedUser = user?.user
                ? {
                    ...user,
                    user: {
                        ...user.user,
                        preferences: updatedPreferences
                    }
                }
                : {
                    ...user,
                    preferences: updatedPreferences
                };
            dispatch({
                type: "UPDATE_USER",
                payload: updatedUser
            });
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setSuccess("Appearance updated successfully.");
        } catch (error) {
            setError(error.response?.data?.message || "Unable to update appearance.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="appearance-settings">
            <div className="settings-section-header">
                <h2>
                    Appearance
                </h2>
                <p>
                    Customize how DeployX looks.
                </p>
            </div>
            <div className="appearance-option-group">
                <h3>
                    Theme
                </h3>
                <p>
                    Select the theme you want to use.
                </p>
                <div className="theme-options">
                    <button
                        type="button"
                        className={`theme-option ${
                            theme === "dark"
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            handleThemeChange("dark")
                        }
                    >
                        <span className="theme-preview dark-preview">
                            ◐
                        </span>
                        <span>
                            <strong>Dark</strong>
                            <small>
                                Dark appearance
                            </small>
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`theme-option ${
                            theme === "light"
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            handleThemeChange("light")
                        }
                    >
                        <span className="theme-preview light-preview">
                            ☀
                        </span>
                        <span>
                            <strong>Light</strong>
                            <small>
                                Light appearance
                            </small>
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`theme-option ${
                            theme === "system"
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            handleThemeChange("system")
                        }
                    >
                        <span className="theme-preview system-preview">
                            ◐
                        </span>
                        <span>
                            <strong>System</strong>
                            <small>
                                Follow your device
                            </small>
                        </span>
                    </button>
                </div>
            </div>
            {loading && (
                <p className="appearance-status">
                    Saving...
                </p>
            )}
            {error && (
                <p className="appearance-error">
                    <ErrorState message={error}/>
                </p>
            )}
            {success && (
                <p className="appearance-success">
                    {success}
                </p>
            )}
        </div>
    );
};

export default Appearance;
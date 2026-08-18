import { NavLink, Outlet } from "react-router-dom";
import "./Settings.css";

const Settings = () => {

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>
                    Settings
                </h1>
                <p>
                    Manage your DeployX account and preferences.
                </p>
            </div>
            <div className="settings-layout">
                <aside className="settings-sidebar">
                    <NavLink
                        to="/settings"
                        end
                        className={({ isActive }) =>
                            `settings-nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        Account
                    </NavLink>
                    <NavLink
                        to="/settings/appearance"
                        className={({ isActive }) =>
                            `settings-nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        Appearance
                    </NavLink>
                    <NavLink
                        to="/settings/notifications"
                        className={({ isActive }) =>
                            `settings-nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        Notifications
                    </NavLink>
                    <NavLink
                        to="/settings/security"
                        className={({ isActive }) =>
                            `settings-nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        Security
                    </NavLink>
                    
                </aside>
                <section className="settings-content">
                    <Outlet />
                </section>
            </div>
        </div>
    );
};

export default Settings;
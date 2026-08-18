import { NavLink, Link } from "react-router-dom";
import { FiGrid, FiFolder, FiSend, FiSettings, FiGithub, FiLogOut } from "react-icons/fi";
import useLogout from "../../hooks/useLogout";
import "./Sidebar.css";

const Sidebar = () => {

    const logout = useLogout();

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <Link
                    to="/dashboard"
                    className="sidebar-logo"
                >
                    Deploy<span>X</span>
                </Link>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">
                        Overview
                    </div>
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <FiGrid />
                        <span>Dashboard</span>
                    </NavLink>
                    <div className="sidebar-section-title">
                        Manage
                    </div>
                    <NavLink
                        to="/projects"
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <FiFolder />
                        <span>Projects</span>
                    </NavLink>
                    <NavLink
                        to="/deployments"
                        className="sidebar-link"
                    >
                        <FiSend />
                        <span>Deployments</span>
                    </NavLink>
                    <NavLink
                        to="/github"
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "active" : ""}`
                        }
                    >
                        <FiGithub />
                        <span>GitHub</span>
                    </NavLink>
                </nav>
            </div>
            <div className="sidebar-bottom">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <FiSettings />
                    <span>Settings</span>
                </NavLink>
                <button
                    type="button"
                    className="sidebar-logout"
                    onClick={logout}
                >
                    <FiLogOut />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
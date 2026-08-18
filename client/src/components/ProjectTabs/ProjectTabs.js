import { NavLink, useParams } from "react-router-dom";
import "./ProjectTabs.css";

const ProjectTabs = () => {

    const { id } = useParams();

    return (
        <nav className="project-tabs">
            <NavLink
                end
                to={`/projects/${id}`}
                className="project-tab"
            >
                Overview
            </NavLink>
            <NavLink
                to={`/projects/${id}/deployments`}
                className="project-tab"
            >
                Deployments
            </NavLink>
            <NavLink
                to={`/projects/${id}/environment`}
                className="project-tab"
            >
                Environment Variables
            </NavLink>
            <NavLink
                to={`/projects/${id}/settings`}
                className="project-tab"
            >
                Settings
            </NavLink>
        </nav>
    );
};

export default ProjectTabs;
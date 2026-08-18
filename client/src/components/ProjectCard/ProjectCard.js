import { Link } from "react-router-dom";
import { GiCardboardBoxClosed } from "react-icons/gi";
import "./ProjectCard.css";

const ProjectCard = ({ project }) => {

    return (
        <div className="project-card">
            <div className="project-card-header">
                <div className="project-icon">
                    <GiCardboardBoxClosed />
                </div>
                <span className="project-framework">
                    {project.framework || "Unknown"}
                </span>
            </div>
            <h3>
                {project.name}
            </h3>
            <p className="project-repository">
                {project.repository}
            </p>
            <div className="project-card-footer">
                <span>
                    {project.buildCommand || "Build"}
                </span>
                <Link
                    to={`/projects/${project._id}`}
                    className="project-view-button"
                >
                    View Project →
                </Link>
            </div>
        </div>
    );
};

export default ProjectCard;
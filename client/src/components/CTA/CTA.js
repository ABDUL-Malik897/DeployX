import { Link } from "react-router-dom";
import "./CTA.css";

const CTA = () => {
    return (
        <section className="cta">
            <div className="cta-content">
                <span className="cta-label">
                    READY TO DEPLOY?
                </span>
                <h2>
                    Ship your next project with DeployX.
                </h2>
                <p>
                    Connect your GitHub repository and get your application deployed without the usual setup.
                </p>
                <Link
                    to="/signup"
                    className="cta-button"
                >
                    Get Started
                </Link>
            </div>
        </section>
    );
};

export default CTA;
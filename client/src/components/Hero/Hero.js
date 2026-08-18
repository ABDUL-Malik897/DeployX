import { Link } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
    return (
        <section className="hero">

            <div className="hero-content">

                <div className="hero-badge">
                    🚀 Deploy from GitHub
                </div>

                <h1>
                    Deploy your apps
                    <span> without the hassle.</span>
                </h1>

                <p>
                    Connect your GitHub repository, build your application,
                    and get it live in seconds. DeployX handles the
                    deployment process for you.
                </p>

                <div className="hero-actions">

                    <Link
                        to="/signup"
                        className="hero-primary-button"
                    >
                        Get Started
                    </Link>

                    <a
                        href="#how-it-works"
                        className="hero-secondary-button"
                    >
                        How It Works
                    </a>

                </div>

                <div className="hero-flow">

                    <div className="flow-step">
                        <span>01</span>
                        <p>Connect GitHub</p>
                    </div>

                    <div className="flow-line"></div>

                    <div className="flow-step">
                        <span>02</span>
                        <p>Build</p>
                    </div>

                    <div className="flow-line"></div>

                    <div className="flow-step">
                        <span>03</span>
                        <p>Deploy</p>
                    </div>

                </div>

            </div>

        </section>
    );
};

export default Hero;
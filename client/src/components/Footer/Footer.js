import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-main">
                <div className="footer-brand">
                    <Link
                        to="/"
                        className="footer-logo"
                    >
                        Deploy<span>X</span>
                    </Link>
                    <p>
                        A simple deployment platform for applications built with GitHub.
                    </p>
                </div>
                <div className="footer-links">
                    <div className="footer-column">
                        <h3>Product</h3>
                        <a href="#features">
                            Features
                        </a>
                        <a href="#how-it-works">
                            How It Works
                        </a>
                    </div>
                    <div className="footer-column">
                        <h3>Account</h3>
                        <Link to="/login">
                            Login
                        </Link>
                        <Link to="/signup">
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>
                    © {new Date().getFullYear()} DeployX.
                    All rights reserved.
                </p>
                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                >
                    GitHub
                </a>
            </div>
        </footer>
    );
};

export default Footer;
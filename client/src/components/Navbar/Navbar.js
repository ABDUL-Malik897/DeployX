import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link
                to="/"
                className="navbar-logo"
            >
                Deploy<span>X</span>
            </Link>
            <div className="navbar-links">
                <a href="#features">
                    Features
                </a>
                <a href="#how-it-works">
                    How It Works
                </a>
                <Link to="/login">
                    Login
                </Link>
                <Link
                    to="/signup"
                    className="navbar-button"
                >
                    Get Started
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
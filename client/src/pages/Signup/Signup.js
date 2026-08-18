import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import useAuthContext from "../../hooks/useAuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { validateEmail, validatePassword} from "../../utils/validation";
import "./Signup.css";

const Signup = () => {

    const navigate = useNavigate();
    const { dispatch } = useAuthContext();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            if (!name.trim()) {
                setError("Please enter your name.");
                return;
            }
            if (!validateEmail(email)) {
                setError("Please enter a valid email address.");
                return;
            }
            if (!validatePassword(password)) {
                setError("Password must be at least 6 characters.");
                return;
            }
            const response = await API.post("/auth/signup",
                {
                    name,
                    email,
                    password
                }
            );
            localStorage.setItem("token",response.data.token);
            localStorage.setItem( "user",JSON.stringify(response.data.user));

            dispatch({
                type: "LOGIN",
                payload: response.data.user
            });
            navigate("/dashboard");
        } catch (error) {
            setError(error.response?.data?.message || "Unable to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async (credentialResponse) => {
        try {
            setLoading(true);
            setError("");
            const response = await API.post(
                "/auth/google",
                {
                    credential:  credentialResponse.credential
                }
            );
            localStorage.setItem("token", response.data.token);
            localStorage.setItem( "user", JSON.stringify(response.data.user));
            dispatch({
                type: "LOGIN",
                payload: response.data.user
            });
            navigate("/dashboard");
        } catch (error) {
            console.error("Google signup error:", error);
            setError(error.response?.data?.message || "Unable to sign up with Google. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="signup-page">
            <div className="signup-card">
                <div className="signup-header">
                    <Link
                        to="/"
                        className="signup-logo"
                    >
                        Deploy<span>X</span>
                    </Link>
                    <h1>
                        Create your account
                    </h1>
                    <p>
                        Start deploying your applications with DeployX.
                    </p>
                </div>
                <form
                    className="signup-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="name">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            maxLength={100}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>
                    {error && (
                        <p className="signup-error">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="signup-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account"
                        }
                    </button>
                </form>
                <div className="google-signup">
                    <div className="signup-divider">
                        <span>OR</span>
                    </div>
                    <GoogleLogin
                        onSuccess={handleGoogleSignup}
                        onError={() => {
                            setError(
                                "Google signup failed. Please try again."
                            );
                        }}
                    />
                </div>
                <p className="signup-footer">
                    Already have an account?
                    <Link to="/login">
                        Login
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default Signup;
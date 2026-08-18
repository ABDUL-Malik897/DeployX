import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../../api/api";
import useAuthContext from "../../hooks/useAuthContext";
import {validateEmail,validatePassword} from "../../utils/validation";
import "./Login.css";

const Login = () => {

    const navigate = useNavigate();
    const { dispatch } = useAuthContext();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            if (!validateEmail(email)) {
                setError("Please enter a valid email address.");
                return;
            }
            if (!validatePassword(password)) {
                setError("Password must be at least 6 characters.");
                return;
            }
            const response = await API.post(
                "/auth/login",
                {
                    email,
                    password
                }
            );
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));
            dispatch({
                type: "LOGIN",
                payload: response.data.user
            });
            navigate("/dashboard");
        } catch (error) {
            setError(error.response?.data?.message || "Unable to login. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            setLoading(true);
            setError("");
            const response = await API.post(
                "/auth/google",
                {
                    credential: credentialResponse.credential
                }
            );
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user",  JSON.stringify(response.data.user));
            dispatch({
                type: "LOGIN",
                payload: response.data.user
            });
            navigate("/dashboard");
        } catch (error) {
            console.error("Google login error:", error);
            setError(error.response?.data?.message || "Unable to login with Google. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <Link
                        to="/"
                        className="login-logo"
                    >
                        Deploy<span>X</span>
                    </Link>
                    <h1>
                        Welcome back
                    </h1>
                    <p>
                        Login to manage your deployments.
                    </p>
                </div>
                <form
                    className="login-form"
                    onSubmit={handleSubmit}
                >
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
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            required
                        />
                    </div>
                    {error && (
                        <p className="login-error">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"
                        }
                    </button>
                    <div className="google-login">
                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => {
                                setError("Google login failed. Please try again.");
                            }}
                        />
                    </div>
                    <div className="login-divider">
                        <span>OR</span>
                    </div>
                    <button
                        type="button"
                        className="github-login-button"
                        onClick={() => {
                            window.location.href =`${process.env.REACT_APP_API_URL}/auth/github`;
                        }}
                    >
                        Continue with GitHub
                    </button>
                </form>
                <p className="login-footer">
                    Don't have an account?
                    <Link to="/signup">
                        Create one
                    </Link>
                </p>
            </div>
        </main>
    );
};

export default Login;
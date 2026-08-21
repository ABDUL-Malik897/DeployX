import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import useAuthContext from "../../hooks/useAuthContext";

const GithubCallback = () => {

    const navigate = useNavigate();
    const { dispatch } = useAuthContext();

    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const token = params.get("token");
        if (!token) {
            console.error("No GitHub token found");
            navigate("/login");
            return;
        }
        localStorage.setItem("token", token);
        const getUser = async () => {
            try {
                const response = await API.get("/auth/me");
                localStorage.setItem("user", JSON.stringify(response.data.user));
                dispatch({
                    type: "LOGIN",
                    payload: response.data.user
                });
                navigate("/dashboard", { replace: true });
            } catch (error) {
                console.error("GitHub callback error:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/login");
            }
        };
        getUser();
    }, [dispatch, navigate]);


    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white"
            }}
        >
            <h2>
                Completing GitHub login...
            </h2>
        </div>
    );
};

export default GithubCallback;
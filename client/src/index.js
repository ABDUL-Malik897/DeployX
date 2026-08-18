import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AuthContextProvider from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

console.log("GOOGLE CLIENT ID:",process.env.REACT_APP_GOOGLE_CLIENT_ID);

root.render(
    <React.StrictMode>
        <GoogleOAuthProvider
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
        >
            <AuthContextProvider>
                <App />
            </AuthContextProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);
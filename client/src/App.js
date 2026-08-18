import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import Dashboard from "./pages/Dashboard/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import DeploymentDetails from "./pages/DeploymentDetails/DeploymentDetails";
import AppShell from "./Layout/AppShell/AppShell";
import Settings from "./pages/Settings/Settings";
import Account from "./pages/Settings/Account/Account";
import Security from "./pages/Settings/Security/Security";
import Appearance from "./pages/Settings/Appearance/Appearance";
import Notifications from "./pages/Settings/Notifications/Notifications";
import Projects from "./pages/Projects/Projects";
import CreateProject from "./pages/CreateProject/CreateProject";
import ProjectOverview from "./pages/Project/ProjectOverview/ProjectOverview";
import ProjectDeployments from "./pages/Project/ProjectDeployments/ProjectDeployments";
import ProjectEnvironment from "./pages/Project/ProjectEnvironment/ProjectEnvironment";
import ProjectSettings from "./pages/Project/ProjectSettings/ProjectSettings";
import Deployments from "./pages/Deployments/Deployments";
import GitHub from "./pages/Settings/GitHub/GitHub";
import GithubCallback from "./pages/GithubCallback/GithubCallback";


const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Landing />}
                />
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <PublicRoute>
                            <Signup />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/github/callback"
                    element={<GithubCallback />}
                />
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppShell />}>
                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />
                        <Route
                            path="/deployments/:id"
                            element={<DeploymentDetails />}
                        />
                        <Route
                            path="github"
                            element={<GitHub />}
                        />
                        <Route
                            path="/settings"
                            element={<Settings />}
                        >
                            <Route
                                index
                                element={<Account />}
                            />
                            <Route
                                path="security"
                                element={<Security />}
                            />
                            <Route
                                path="appearance"
                                element={<Appearance />}
                            />
                            <Route
                                path="notifications"
                                element={<Notifications />}
                            />
                        </Route>
                        <Route
                            path="/projects"
                            element={<Projects />}
                        />
                        <Route
                            path="/projects/new"
                            element={<CreateProject />}
                        />
                        <Route
                            path="/projects/:id"
                            element={<ProjectOverview />}
                        />
                        <Route
                            path="/projects/:id/deployments"
                            element={<ProjectDeployments />}
                        />
                        <Route
                            path="/projects/:id/environment"
                            element={<ProjectEnvironment />}
                        />
                        <Route
                            path="/projects/:id/settings"
                            element={<ProjectSettings />}
                        />
                        <Route
                            path="/deployments"
                            element={<Deployments />}
                        />
                        
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;
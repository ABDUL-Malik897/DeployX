import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Topbar from "../../components/Topbar/Topbar";
import "./AppShell.css";

const AppShell = () => {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="app-shell-content">
                <Topbar />
                <main className="app-shell-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AppShell;
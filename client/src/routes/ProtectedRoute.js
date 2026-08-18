import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthContext from "../hooks/useAuthContext";
import LoadingState from "../components/LoadingState/LoadingState";

const ProtectedRoute = () => {

    const {user,isLoading} = useAuthContext();
    const location = useLocation();

    if (isLoading) {
        return (
            <div>
                <LoadingState message="Loading..."/>
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        );
    }
    return <Outlet />;
};

export default ProtectedRoute;
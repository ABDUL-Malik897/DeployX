import { Navigate } from "react-router-dom";
import useAuthContext from "../hooks/useAuthContext";
import LoadingState from "../components/LoadingState/LoadingState";

const PublicRoute = ({ children }) => {

    const {user, isLoading} = useAuthContext();
    if (isLoading) {
        return (
            <div>
                <LoadingState message="Loading..."/>
            </div>
        );
    }
    if (user) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }
    return children;
};

export default PublicRoute;
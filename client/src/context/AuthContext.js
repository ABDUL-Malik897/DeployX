import { createContext, useEffect, useReducer } from "react";

export const AuthContext = createContext();

const initialState = {
    user: null,
    isLoading: true
};

const authReducer = (state, action) => {

    switch (action.type) {
        case "LOGIN":
            return {
                user: action.payload,
                isLoading: false
            };
        case "UPDATE_USER":
            return {
                ...state,
                user: action.payload,
                isLoading: false
            };
        case "LOGOUT":
            return {
                user: null,
                isLoading: false
            };
        case "AUTH_READY":
            return {
                ...state,
                isLoading: false
            };
        default:
            return state;
    }
};

const AuthContextProvider = ({ children }) => {

    const [state, dispatch] = useReducer(
        authReducer,
        initialState
    );

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                dispatch({
                    type: "LOGIN",
                    payload: user
                });
            } catch (error) {
                console.error("Invalid stored authentication data:", error);
                localStorage.removeItem("user");
                dispatch({
                    type: "AUTH_READY"
                });
            }
        } else {
            dispatch({
                type: "AUTH_READY"
            });
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                ...state,
                dispatch
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContextProvider;
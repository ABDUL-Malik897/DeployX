import "./ErrorState.css";

const ErrorState = ({
    message = "Something went wrong.",
    onRetry
}) => {

    return (
        <div className="error-state">
            <div className="error-state-icon">
                ⚠️
            </div>
            <h3>
                Something went wrong
            </h3>
            <p>
                {message}
            </p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="error-retry-button"
                >
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorState;
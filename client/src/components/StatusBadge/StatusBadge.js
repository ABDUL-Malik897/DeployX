import "./StatusBadge.css";

const StatusBadge = ({ status }) => {

    const label = status || "unknown";

    return (
        <span
            className={`status-badge status-${label}`}
        >
            {label}
        </span>
    );
};

export default StatusBadge;
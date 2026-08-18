import "./StatsCard.css";

const StatsCard = ({ title, value, icon }) => {
    return (
        <div className="stats-card">
            <div className="stats-card-top">
                <span className="stats-card-title">
                    {title}
                </span>
                <span className="stats-card-icon">
                    {icon}
                </span>
            </div>
            <div className="stats-card-value">
                {value}
            </div>
        </div>
    );
};

export default StatsCard;
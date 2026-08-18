import "./Features.css";

const features = [
    {
        icon: "⚡",
        title: "Automatic Deployments",
        description:
            "Connect your GitHub repository and deploy your application without manually handling the build process."
    },
    {
        icon: "🔗",
        title: "GitHub Integration",
        description:
            "Keep your existing workflow. Push your code to GitHub and let DeployX handle the deployment."
    },
    {
        icon: "📜",
        title: "Live Build Logs",
        description:
            "See exactly what is happening during your deployment with real-time build and deployment logs."
    },
    {
        icon: "🔐",
        title: "Environment Variables",
        description:
            "Configure the environment variables your application needs during the build process."
    },
    {
        icon: "🔄",
        title: "One-Click Redeploy",
        description:
            "Something changed? Redeploy your project without going through the entire setup again."
    },
    {
        icon: "🌐",
        title: "Instant Deployment URL",
        description:
            "After a successful build, DeployX gives your application a URL that you can access immediately."
    }
];

const Features = () => {
    return (
        <section
            id="features"
            className="features"
        >
            <div className="features-header">
                <span className="features-label">
                    FEATURES
                </span>
                <h2>
                    Everything you need to deploy
                </h2>
                <p>
                    DeployX takes care of the repetitive deployment work so you can focus on building your application.
                </p>
            </div>
            <div className="features-grid">
                {features.map((feature) => (
                    <div
                        className="feature-card"
                        key={feature.title}
                    >
                        <div className="feature-icon">
                            {feature.icon}
                        </div>
                        <h3>
                            {feature.title}
                        </h3>
                        <p>
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Features;
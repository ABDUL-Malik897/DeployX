import "./HowItWorks.css";

const steps = [
    {
        number: "01",
        title: "Connect your repository",
        description:
            "Add your GitHub repository to DeployX and create a project.",
        icon: "🔗"
    },
    {
        number: "02",
        title: "DeployX builds your app",
        description:
            "DeployX clones your repository, installs dependencies, and runs your build command.",
        icon: "⚙️"
    },
    {
        number: "03",
        title: "Track the deployment",
        description:
            "Watch the deployment progress and build logs directly from your dashboard.",
        icon: "📋"
    },
    {
        number: "04",
        title: "Your app goes live",
        description:
            "Once the build succeeds, DeployX gives you a deployment URL for your application.",
        icon: "🌐"
    }
];

const HowItWorks = () => {
    return (
        <section
            id="how-it-works"
            className="how-it-works"
        >
            <div className="how-it-works-header">
                <span className="how-it-works-label">
                    HOW IT WORKS
                </span>
                <h2>
                    From GitHub to live in a few steps
                </h2>
                <p>
                    DeployX handles the deployment process while you focus on writing code.
                </p>
            </div>
            <div className="steps-container">
                {steps.map((step, index) => (
                    <div
                        className="step"
                        key={step.number}
                    >
                        <div className="step-number">
                            {step.number}
                        </div>
                        <div className="step-icon">
                            {step.icon}
                        </div>
                        <h3>
                            {step.title}
                        </h3>
                        <p>
                            {step.description}
                        </p>
                        {index < steps.length - 1 && (
                            <div className="step-line" />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
};

export default HowItWorks;
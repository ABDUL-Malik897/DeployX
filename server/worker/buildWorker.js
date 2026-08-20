const connectDB = require("../config/db");

require("dotenv").config();

const startWorker = async () => {
    try {
        await connectDB();

        console.log(
            "DeployX build worker disabled."
        );

        console.log(
            "Deployments are handled by GitHub Actions."
        );

    } catch (error) {

        console.error(
            "Unable to initialize worker:",
            error
        );

        process.exit(1);
    }
};

startWorker();
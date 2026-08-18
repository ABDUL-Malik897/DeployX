const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const deploymentRoutes = require("./routes/deploymentRoutes");
const hostingRoutes = require("./routes/hostingRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const githubRoutes = require("./routes/githubRoutes");

const app = express();
app.use(cors());
app.use(
    express.json({
        verify: (req, res, buffer) => {
            if (
                req.originalUrl.startsWith(
                    "/api/webhooks/github"
                )
            ) {
                req.rawBody = buffer;
            }
        }
    })
);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/deployments", deploymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/github", githubRoutes)
app.use("/", hostingRoutes);


app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DeployX API is running"
    });
});

const PORT = process.env.PORT || 4000;

const startServer = async () => {
    await connectDB();
    const http = require("http");
    const { initializeSocket } = require("./socket");
    const server = http.createServer(app);
    initializeSocket(server);
    server.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });
};

startServer();
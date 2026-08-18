const { Server } = require("socket.io");

let io;

const initializeSocket = (server) => {

    io = new Server(server, {
        cors: {
            origin: ["http://localhost:3001","https://deploy-x-ashen.vercel.app"],
            credentials: true
        }
    });
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        socket.on("join-deployment",(deploymentId) => {
            socket.join(deploymentId);
        });
        socket.on("join-project",(projectId) => {
            socket.join(`project:${projectId}`);
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });
};

const getIO = () => io;

module.exports = {
    initializeSocket,
    getIO
};
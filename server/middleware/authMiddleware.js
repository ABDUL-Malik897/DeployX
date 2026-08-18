const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).json({
                message: "Authorization token required"
            });
        }
        const [type, token] = authorization.split(" ");
        if (type !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }
        const decoded = jwt.verify(
            token,
            process.env.SECRET
        );
        const user = await User.findById(decoded._id)
            .select("-password");
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Request is not authorized"
        });
    }
};

module.exports = requireAuth;
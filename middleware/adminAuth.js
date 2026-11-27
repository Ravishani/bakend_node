
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function adminAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const userId =
            decoded.id ||
            decoded._id ||
            decoded.userId ||
            decoded.sub;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const role =
            typeof user.role === "object"
                ? user.role?.name
                : user.role;

        const isAdmin =
            user.isAdmin === true ||
            String(role || "").toLowerCase() === "admin" ||
            (Array.isArray(user.roles) &&
                user.roles.some((item) =>
                    String(
                        typeof item === "object" ? item.name : item
                    ).toLowerCase() === "admin"
                ));

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Admin access required",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                error.name === "TokenExpiredError"
                    ? "Session expired"
                    : "Invalid authentication",
        });
    }
}

module.exports = adminAuth;

const VisitorLog = require("../models/VisitorLog");

const trackVisitor = (req, res, next) => {
    if (
        !req.originalUrl.startsWith("/api/") ||
        req.originalUrl.startsWith("/api/visitors")
    ) {
        return next();
    }

    const startTime = Date.now();

    res.on("finish", async () => {
        try {
            // Existing visitor logging logic yahan rahega.
        } catch (error) {
            console.error("Visitor Tracking Error:", error.message);
        }
    });

    next();
};

module.exports = trackVisitor;
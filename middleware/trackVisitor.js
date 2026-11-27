
const VisitorLog = require("../models/VisitorLog");
const geoip = require("geoip-lite");
const UAParser = require("ua-parser-js");

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
            const forwardedFor = req.headers["x-forwarded-for"];

            const ip = String(
                req.ip ||
                req.socket?.remoteAddress ||
                ""
            )
                .split(",")[0]
                .trim()
                .replace(/^::ffff:/, "");

            const userAgent = req.headers["user-agent"] || "";
            const parser = new UAParser(userAgent);
            const browser = parser.getBrowser();
            const os = parser.getOS();
            const device = parser.getDevice();

            const geo = geoip.lookup(ip);

            const sessionId =
                req.headers["x-visitor-session"] ||
                req.body?.sessionId ||
                null;

            await VisitorLog.create({
                eventType: "api",
                ip,
                url: req.originalUrl,
                method: req.method,
                statusCode: res.statusCode,
                responseTime: Date.now() - startTime,

                browser: browser.name || "Unknown",
                browserVersion: browser.version || "",
                os: os.name || "Unknown",
                osVersion: os.version || "",

                device: device.model || device.type || "Desktop",
                deviceType: device.type || "desktop",

                userAgent,
                referrer: req.headers.referer || "",

                country: geo?.country || "Unknown",
                region: geo?.region || "",
                city: geo?.city || "",

                sessionId,
            });
        } catch (error) {
            console.error("Visitor Tracking Error:", error.message);
        }
    });

    next();
};

module.exports = trackVisitor;

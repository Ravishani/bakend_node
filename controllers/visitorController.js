
const VisitorLog = require("../models/VisitorLog");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

function getDetails(req) {
    const ip = req.ip || req.socket?.remoteAddress || "Unknown";
    const userAgent = req.headers["user-agent"] || "";
    const result = new UAParser(userAgent).getResult();
    const geo = geoip.lookup(ip.replace(/^::ffff:/, ""));

    return {
        ip,
        userAgent,
        browser: result.browser.name || "Unknown",
        browserVersion: result.browser.version || "",
        os: result.os.name || "Unknown",
        device: result.device.model || result.device.vendor || "Unknown",
        deviceType: result.device.type || "Desktop",
        country: geo?.country || req.headers["cf-ipcountry"] || "Unknown",
        region: geo?.region || "",
        city: geo?.city || "",
        referrer: req.body.referrer || req.headers.referer || "",
        sessionId: req.body.sessionId || null,
    };
}

exports.trackPage = async (req, res) => {
    try {
        const { url, title, sessionId } = req.body;

        if (
            typeof url !== "string" ||
            !url.startsWith("/") ||
            url.length > 2048 ||
            url.startsWith("//")
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid page URL",
            });
        }

        if (
            typeof sessionId !== "string" ||
            !/^[a-zA-Z0-9-]{10,100}$/.test(sessionId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid session",
            });
        }

        const details = getDetails(req);

        await VisitorLog.create({
            eventType: "page",
            ...details,
            url,
            method: "GET",
            sessionId,
            timestamp: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Visit recorded",
        });
    } catch (error) {
        console.error("Page tracking error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to record visit",
        });
    }
};

exports.getAnalytics = async (req, res) => {
    try {
        const days = Math.min(
            Math.max(parseInt(req.query.days, 10) || 30, 1),
            365
        );

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const match = {
            timestamp: { $gte: startDate },
        };

        const [
            pageViews,
            apiHits,
            uniqueVisitors,
            countries,
            topPages,
            dailyVisits,
            recentVisitors,
        ] = await Promise.all([
            VisitorLog.countDocuments({
                ...match,
                eventType: "page",
            }),

            VisitorLog.countDocuments({
                ...match,
                eventType: "api",
            }),

            VisitorLog.distinct("sessionId", {
                ...match,
                eventType: "page",
                sessionId: { $ne: null },
            }),

            VisitorLog.aggregate([
                { $match: { ...match, eventType: "page" } },
                {
                    $group: {
                        _id: "$country",
                        visits: { $sum: 1 },
                    },
                },
                { $sort: { visits: -1 } },
                { $limit: 10 },
            ]),

            VisitorLog.aggregate([
                { $match: { ...match, eventType: "page" } },
                {
                    $group: {
                        _id: "$url",
                        visits: { $sum: 1 },
                    },
                },
                { $sort: { visits: -1 } },
                { $limit: 10 },
            ]),

            VisitorLog.aggregate([
                { $match: { ...match, eventType: "page" } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp",
                            },
                        },
                        visits: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),

            VisitorLog.find(match)
                .sort({ timestamp: -1 })
                .limit(10)
                .lean(),
        ]);

        res.json({
            success: true,
            data: {
                pageViews,
                apiHits,
                uniqueVisitors: uniqueVisitors.length,
                countriesCount: countries.length,
                countries,
                topPages,
                dailyVisits,
                recentVisitors,
            },
        });
    } catch (error) {
        console.error("Analytics error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load analytics",
        });
    }
};

exports.getVisitors = async (req, res) => {
    try {
        const page = Math.max(
            parseInt(req.query.page, 10) || 1,
            1
        );

        const limit = Math.min(
            Math.max(parseInt(req.query.limit, 10) || 20, 1),
            100
        );

        const filter = {};

        const type = req.query.type;
        if (["page", "api"].includes(type)) {
            filter.eventType = type;
        }

        if (req.query.search) {
            const search = String(req.query.search).slice(0, 200);

            filter.$or = [
                { ip: { $regex: search, $options: "i" } },
                { url: { $regex: search, $options: "i" } },
                { country: { $regex: search, $options: "i" } },
                { city: { $regex: search, $options: "i" } },
            ];
        }

        if (req.query.days) {
            const days = Math.min(
                Math.max(parseInt(req.query.days, 10) || 30, 1),
                365
            );

            const start = new Date();
            start.setDate(start.getDate() - days);

            filter.timestamp = { $gte: start };
        }

        const [visitors, total] = await Promise.all([
            VisitorLog.find(filter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            VisitorLog.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: visitors,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Visitors list error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load visitors",
        });
    }
};

exports.deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params;

        if (!/^[a-f\d]{24}$/i.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid visitor ID",
            });
        }

        const deleted = await VisitorLog.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Visitor record not found",
            });
        }

        res.json({
            success: true,
            message: "Visitor record deleted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Unable to delete visitor",
        });
    }
};

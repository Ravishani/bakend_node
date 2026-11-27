
const VisitorLog = require("../models/VisitorLog");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");

function safeString(value, maxLength = 500) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function normalizeAttribution(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return null;
    }

    return {
        source: safeString(data.source, 150) || "Direct",
        sourceType: safeString(data.sourceType, 100) || "Direct",
        medium: safeString(data.medium, 150) || "direct",
        referrer: safeString(data.referrer, 2048),
        utmSource: safeString(data.utmSource, 200),
        utmMedium: safeString(data.utmMedium, 200),
        utmCampaign: safeString(data.utmCampaign, 255),
        utmTerm: safeString(data.utmTerm, 255),
        utmContent: safeString(data.utmContent, 255),
        capturedAt: data.capturedAt
            ? new Date(data.capturedAt)
            : new Date(),
    };
}

function getDetails(req) {
    const rawIp = String(
        req.ip || req.socket?.remoteAddress || "Unknown"
    );

    const ip = rawIp
        .split(",")[0]
        .trim()
        .replace(/^::ffff:/, "");

    const userAgent = req.headers["user-agent"] || "";
    const result = new UAParser(userAgent).getResult();

    const geo = geoip.lookup(ip);

    return {
        ip,
        userAgent,

        browser: result.browser.name || "Unknown",
        browserVersion: result.browser.version || "",

        os: result.os.name || "Unknown",
        osVersion: result.os.version || "",

        device:
            result.device.model ||
            result.device.vendor ||
            result.device.type ||
            "Desktop",

        deviceType: result.device.type || "desktop",

        country:
            geo?.country ||
            req.headers["cf-ipcountry"] ||
            "Unknown",

        region: geo?.region || "",
        city: geo?.city || "",

        referrer: safeString(
            req.body.referrer || req.headers.referer || "",
            2048
        ),

        sessionId: req.body.sessionId || null,
    };
}

function getDateRange(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return startDate;
}

exports.trackPage = async (req, res) => {
    try {
        const { url, sessionId } = req.body;

        if (
            typeof url !== "string" ||
            !url.startsWith("/") ||
            url.startsWith("//") ||
            url.length > 2048
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

        const firstTouch = normalizeAttribution(
            req.body.firstTouch
        );

        const lastTouch = normalizeAttribution(
            req.body.lastTouch
        );

        const trafficSource =
            safeString(req.body.trafficSource, 150) ||
            lastTouch?.source ||
            "Direct";

        const sourceType =
            safeString(req.body.sourceType, 100) ||
            lastTouch?.sourceType ||
            "Direct";

        const utmSource =
            safeString(req.body.utmSource, 200) ||
            lastTouch?.utmSource ||
            "";

        const utmMedium =
            safeString(req.body.utmMedium, 200) ||
            lastTouch?.utmMedium ||
            "";

        const utmCampaign =
            safeString(req.body.utmCampaign, 255) ||
            lastTouch?.utmCampaign ||
            "";

        const utmTerm =
            safeString(req.body.utmTerm, 255) ||
            lastTouch?.utmTerm ||
            "";

        const utmContent =
            safeString(req.body.utmContent, 255) ||
            lastTouch?.utmContent ||
            "";

        await VisitorLog.create({
            eventType: "page",

            ...details,

            url,
            method: "GET",
            sessionId,

            trafficSource,
            sourceType,

            utmSource,
            utmMedium,
            utmCampaign,
            utmTerm,
            utmContent,

            firstTouch,
            lastTouch,

            timestamp: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: "Visit recorded",
        });
    } catch (error) {
        console.error("Page tracking error:", error.message);

        return res.status(500).json({
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

        const startDate = new Date(
            Date.now() - (days * 24 * 60 * 60 * 1000)
        );

        const match = {
            timestamp: { $gte: startDate },
            eventType: "page",
        };

        const hasUtm = {
            $or: [
                { $gt: [{ $strLenCP: { $ifNull: ["$utmSource", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$utmMedium", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$utmCampaign", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$utmTerm", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$utmContent", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$firstTouch.utmSource", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$lastTouch.utmSource", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$firstTouch.utmMedium", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$lastTouch.utmMedium", ""] } }, 0] },
            ],
        };

        const [
            pageViews,
            uniqueVisitors,
            countries,
            topPages,
            dailyVisits,
            recentVisitors,
            trafficSources,
            sourceTypes,
            campaigns,
            firstTouchSources,
            lastTouchSources,
            apiHits,
            utmResult,
        ] = await Promise.all([
            VisitorLog.countDocuments(match),

            VisitorLog.distinct("sessionId", {
                ...match,
                sessionId: { $ne: null },
            }),

            VisitorLog.aggregate([
                { $match: match },
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
                { $match: match },
                {
                    $group: {
                        _id: "$url",
                        visits: { $sum: 1 },
                    },
                },
                { $sort: { visits: -1 } },
                { $limit: 10 },
            ]),

            // Daily graph data
            VisitorLog.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$timestamp",
                                timezone: "Asia/Kolkata",
                            },
                        },

                        pageViews: { $sum: 1 },

                        uniqueSessions: {
                            $addToSet: "$sessionId",
                        },

                        utmVisits: {
                            $sum: {
                                $cond: [
                                    hasUtm,
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        pageViews: 1,
                        utmVisits: 1,

                        uniqueVisitors: {
                            $size: {
                                $filter: {
                                    input: "$uniqueSessions",
                                    as: "session",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$session", null] },
                                            { $ne: ["$$session", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]),

            VisitorLog.find(match)
                .sort({ timestamp: -1 })
                .limit(10)
                .lean(),

            // Traffic Sources
            VisitorLog.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$trafficSource",
                        visits: { $sum: 1 },
                        uniqueSessions: { $addToSet: "$sessionId" },
                    },
                },
                {
                    $project: {
                        source: "$_id",
                        visits: 1,
                        uniqueVisitors: {
                            $size: {
                                $filter: {
                                    input: "$uniqueSessions",
                                    as: "session",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$session", null] },
                                            { $ne: ["$$session", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                { $sort: { visits: -1 } },
            ]),

            // Source Types
            VisitorLog.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$sourceType",
                        visits: { $sum: 1 },
                        uniqueSessions: { $addToSet: "$sessionId" },
                    },
                },
                {
                    $project: {
                        sourceType: "$_id",
                        visits: 1,
                        uniqueVisitors: {
                            $size: {
                                $filter: {
                                    input: "$uniqueSessions",
                                    as: "session",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$session", null] },
                                            { $ne: ["$$session", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                { $sort: { visits: -1 } },
            ]),

            // UTM Campaigns
            VisitorLog.aggregate([
                {
                    $match: {
                        ...match,
                        utmCampaign: { $nin: ["", null] },
                    },
                },
                {
                    $group: {
                        _id: {
                            campaign: "$utmCampaign",
                            source: "$utmSource",
                            medium: "$utmMedium",
                        },
                        visits: { $sum: 1 },
                        uniqueSessions: { $addToSet: "$sessionId" },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        campaign: "$_id.campaign",
                        source: "$_id.source",
                        medium: "$_id.medium",
                        visits: 1,
                        uniqueVisitors: {
                            $size: {
                                $filter: {
                                    input: "$uniqueSessions",
                                    as: "session",
                                    cond: {
                                        $and: [
                                            { $ne: ["$$session", null] },
                                            { $ne: ["$$session", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                { $sort: { visits: -1 } },
                { $limit: 20 },
            ]),

            // First Touch
            VisitorLog.aggregate([
                {
                    $match: {
                        ...match,
                        "firstTouch.source": { $nin: ["", null] },
                    },
                },
                {
                    $group: {
                        _id: "$firstTouch.source",
                        visits: { $sum: 1 },
                    },
                },
                { $sort: { visits: -1 } },
            ]),

            // Last Touch
            VisitorLog.aggregate([
                {
                    $match: {
                        ...match,
                        "lastTouch.source": { $nin: ["", null] },
                    },
                },
                {
                    $group: {
                        _id: "$lastTouch.source",
                        visits: { $sum: 1 },
                    },
                },
                { $sort: { visits: -1 } },
            ]),

            VisitorLog.countDocuments({
                timestamp: { $gte: startDate },
                eventType: "api",
            }),

            // Total UTM Visits
            VisitorLog.aggregate([
                { $match: match },
                { $match: { $expr: hasUtm } },
                { $count: "total" },
            ]),
        ]);

        const utmVisits = utmResult[0]?.total || 0;

        return res.json({
            success: true,
            data: {
                pageViews,
                uniqueVisitors: uniqueVisitors.length,
                countriesCount: countries.length,
                utmVisits,

                apiHits,
                countries,
                topPages,
                dailyVisits,
                recentVisitors,
                trafficSources,
                sourceTypes,
                campaigns,
                firstTouchSources,
                lastTouchSources,
            },
        });

    } catch (error) {
        console.error("Analytics error:", error);

        return res.status(500).json({
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

        const filter = {
            eventType: "page",
        };

        if (req.query.search) {
            const search = String(req.query.search).slice(0, 200);

            filter.$or = [
                { ip: { $regex: search, $options: "i" } },
                { url: { $regex: search, $options: "i" } },
                { country: { $regex: search, $options: "i" } },
                { city: { $regex: search, $options: "i" } },
                {
                    trafficSource: {
                        $regex: search,
                        $options: "i",
                    },
                },
                {
                    utmCampaign: {
                        $regex: search,
                        $options: "i",
                    },
                },
            ];
        }

        if (req.query.days) {
            const days = Math.min(
                Math.max(parseInt(req.query.days, 10) || 30, 1),
                365
            );

            filter.timestamp = {
                $gte: getDateRange(days),
            };
        }

        const [visitors, total] = await Promise.all([
            VisitorLog.find(filter)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            VisitorLog.countDocuments(filter),
        ]);

        return res.json({
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

        return res.status(500).json({
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

        return res.json({
            success: true,
            message: "Visitor record deleted",
        });
    } catch (error) {
        console.error("Delete visitor error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete visitor",
        });
    }
};

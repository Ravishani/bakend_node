
const mongoose = require("mongoose");

const attributionSchema = new mongoose.Schema(
    {
        source: {
            type: String,
            default: "Direct",
        },
        sourceType: {
            type: String,
            default: "Direct",
        },
        medium: {
            type: String,
            default: "direct",
        },
        referrer: {
            type: String,
            default: "",
        },
        utmSource: {
            type: String,
            default: "",
        },
        utmMedium: {
            type: String,
            default: "",
        },
        utmCampaign: {
            type: String,
            default: "",
        },
        utmTerm: {
            type: String,
            default: "",
        },
        utmContent: {
            type: String,
            default: "",
        },
        capturedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);

const visitorLogSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            enum: ["page", "api"],
            required: true,
            index: true,
        },

        ip: {
            type: String,
            default: "Unknown",
            index: true,
        },

        url: {
            type: String,
            default: "",
            index: true,
        },

        method: {
            type: String,
            default: "GET",
        },

        statusCode: Number,
        responseTime: Number,

        browser: String,
        browserVersion: String,
        os: String,
        osVersion: String,

        device: String,
        deviceType: String,

        userAgent: String,
        referrer: String,

        country: String,
        region: String,
        city: String,

        sessionId: {
            type: String,
            default: null,
            index: true,
        },

        // Traffic Source
        trafficSource: {
            type: String,
            default: "Direct",
            index: true,
        },

        sourceType: {
            type: String,
            default: "Direct",
            index: true,
        },

        // UTM Campaign Details
        utmSource: {
            type: String,
            default: "",
        },

        utmMedium: {
            type: String,
            default: "",
        },

        utmCampaign: {
            type: String,
            default: "",
            index: true,
        },

        utmTerm: {
            type: String,
            default: "",
        },

        utmContent: {
            type: String,
            default: "",
        },

        // First and Last Touch Attribution
        firstTouch: {
            type: attributionSchema,
            default: null,
        },

        lastTouch: {
            type: attributionSchema,
            default: null,
        },

        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "visitor_logs",
    }
);

visitorLogSchema.index({ timestamp: -1 });
visitorLogSchema.index({ eventType: 1, timestamp: -1 });
visitorLogSchema.index({ ip: 1, timestamp: -1 });
visitorLogSchema.index({ trafficSource: 1, timestamp: -1 });
visitorLogSchema.index({ sourceType: 1, timestamp: -1 });
visitorLogSchema.index({ utmCampaign: 1, timestamp: -1 });
visitorLogSchema.index({ sessionId: 1, timestamp: -1 });

module.exports = mongoose.model("VisitorLog", visitorLogSchema);


const mongoose = require("mongoose");

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

module.exports = mongoose.model("VisitorLog", visitorLogSchema);

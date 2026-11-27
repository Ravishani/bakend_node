
const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        countryCode: {
            type: String,
            default: "+91",
            trim: true,
        },
        fullPhone: {
            type: String,
            trim: true,
        },
        company: {
            type: String,
            trim: true,
            default: "",
        },
        service: {
            type: String,
            trim: true,
            default: "",
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service",
            default: null,
        },
        budget: {
            type: String,
            default: "",
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["new", "contacted", "in-progress", "completed", "cancelled"],
            default: "new",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        adminNote: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Enquiry", enquirySchema, "enquiries");

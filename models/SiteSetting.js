
const mongoose = require("mongoose");

const siteSettingSchema = new mongoose.Schema(
    {
        // Website Identity
        siteName: {
            type: String,
            default: "GlobalTechNext",
            trim: true,
        },
        tagline: {
            type: String,
            default: "Smart Digital Payment Solutions",
            trim: true,
        },
        logo: {
            type: String,
            default: "",
            trim: true,
        },
        favicon: {
            type: String,
            default: "",
            trim: true,
        },

        // Contact Information
        email: {
            type: String,
            default: "info@globaltechnext.com",
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            default: "+91 9555787844",
            trim: true,
        },
        alternatePhone: {
            type: String,
            default: "",
            trim: true,
        },
        contactDescription: {
            type: String,
            default: "",
            trim: true,
        },

        // Business Address
        address: {
            type: String,
            default: "",
            trim: true,
        },
        city: {
            type: String,
            default: "",
            trim: true,
        },
        state: {
            type: String,
            default: "",
            trim: true,
        },
        country: {
            type: String,
            default: "India",
            trim: true,
        },
        postalCode: {
            type: String,
            default: "",
            trim: true,
        },

        // Social Media Links
        facebook: {
            type: String,
            default: "",
            trim: true,
        },
        instagram: {
            type: String,
            default: "",
            trim: true,
        },
        linkedin: {
            type: String,
            default: "",
            trim: true,
        },
        youtube: {
            type: String,
            default: "",
            trim: true,
        },

        // Homepage Hero Section
        heroBadge: {
            type: String,
            default: "Welcome to GlobalTechNext",
            trim: true,
        },
        heroTitle: {
            type: String,
            default: "Smart Digital Solutions for Your Business",
            trim: true,
        },
        heroSubtitle: {
            type: String,
            default: "Powering businesses with innovative technology.",
            trim: true,
        },
        heroDescription: {
            type: String,
            default: "",
            trim: true,
        },
        heroParagraph: {
            type: String,
            default: "",
            trim: true,
        },
        heroButtonText: {
            type: String,
            default: "Explore Our Services",
            trim: true,
        },
        heroButtonLink: {
            type: String,
            default: "/services",
            trim: true,
        },
        heroSecondaryButtonText: {
            type: String,
            default: "Contact Us",
            trim: true,
        },
        heroSecondaryButtonLink: {
            type: String,
            default: "/contact",
            trim: true,
        },

        // About Section
        aboutTitle: {
            type: String,
            default: "Technology That Moves Your Business Forward",
            trim: true,
        },
        aboutDescription: {
            type: String,
            default: "",
            trim: true,
        },
        aboutParagraph: {
            type: String,
            default: "",
            trim: true,
        },

        // Footer
        footerDescription: {
            type: String,
            default: "",
            trim: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "site_settings",
    }
);

module.exports =
    mongoose.models.SiteSetting ||
    mongoose.model("SiteSetting", siteSettingSchema);

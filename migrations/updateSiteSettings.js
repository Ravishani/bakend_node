
require("dotenv").config();

const mongoose = require("mongoose");
const SiteSetting = require("../models/SiteSetting");

const migrateSiteSettings = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected.");

        let existing = await SiteSetting.findOne().lean();

        if (!existing) {
            const created = await SiteSetting.create({});
            console.log("Default site settings created:", created._id);
        } else {
            const socialLinks = existing.socialLinks || {};
            const hero = existing.hero || {};

            const updateData = {
                siteName: existing.siteName || "GlobalTechNext",
                tagline: existing.tagline || "Smart Digital Payment Solutions",

                logo: existing.logo || "",
                favicon: existing.favicon || "",

                email: existing.email || "info@globaltechnext.com",
                phone: existing.phone || "+91 9555787844",
                alternatePhone: existing.alternatePhone || "",
                contactDescription: existing.contactDescription || "",

                address: existing.address || "",
                city: existing.city || "",
                state: existing.state || "",
                country: existing.country || "India",
                postalCode: existing.postalCode || "",

                facebook: existing.facebook || socialLinks.facebook || "",
                instagram: existing.instagram || socialLinks.instagram || "",
                linkedin: existing.linkedin || socialLinks.linkedin || "",
                youtube: existing.youtube || socialLinks.youtube || "",

                heroBadge: existing.heroBadge || hero.badge || "Welcome to GlobalTechNext",
                heroTitle: existing.heroTitle || hero.heading || "Smart Digital Solutions for Your Business",
                heroSubtitle: existing.heroSubtitle || hero.subHeading || "Powering businesses with innovative technology.",
                heroDescription: existing.heroDescription || hero.paragraph || "",
                heroParagraph: existing.heroParagraph || "",
                heroButtonText: existing.heroButtonText || hero.buttonText || "Explore Our Services",
                heroButtonLink: existing.heroButtonLink || hero.buttonLink || "/services",
                heroSecondaryButtonText: existing.heroSecondaryButtonText || hero.secondaryButtonText || "Contact Us",
                heroSecondaryButtonLink: existing.heroSecondaryButtonLink || hero.secondaryButtonLink || "",

                aboutTitle: existing.aboutTitle || "Technology That Moves Your Business Forward",
                aboutDescription: existing.aboutDescription || "",
                aboutParagraph: existing.aboutParagraph || "",

                footerDescription: existing.footerDescription || "",

                isActive: existing.isActive !== undefined
                    ? existing.isActive
                    : true,

                updatedAt: new Date(),
            };

            await SiteSetting.collection.updateOne(
                { _id: existing._id },
                {
                    $set: updateData,
                    $unset: {
                        socialLinks: "",
                        hero: "",
                    },
                }
            );

            console.log("Existing site settings migrated successfully.");
        }

        console.log("Site settings migration completed.");
    } catch (error) {
        console.error("Site settings migration failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

migrateSiteSettings();

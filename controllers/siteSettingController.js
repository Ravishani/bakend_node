
const SiteSetting = require("../models/SiteSetting");
const fs = require("fs");
const path = require("path");

const allowedFields = [
    "siteName",
    "tagline",
    "email",
    "phone",
    "alternatePhone",
    "contactDescription",
    "address",
    "city",
    "state",
    "country",
    "postalCode",
    "facebook",
    "instagram",
    "linkedin",
    "youtube",
    "heroBadge",
    "heroTitle",
    "heroSubtitle",
    "heroDescription",
    "heroParagraph",
    "heroButtonText",
    "heroButtonLink",
    "heroSecondaryButtonText",
    "heroSecondaryButtonLink",
    "aboutTitle",
    "aboutDescription",
    "aboutParagraph",
    "footerDescription",
];

const uploadDirectory = path.join(
    __dirname,
    "../uploads/site-settings"
);

const getImageUrl = (file) => {
    return `/uploads/site-settings/${file.filename}`;
};

const deleteOldImage = (imagePath) => {
    if (!imagePath) return;

    const filename = path.basename(imagePath);
    const fullPath = path.join(uploadDirectory, filename);

    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

const getSiteSettings = async (req, res) => {
    try {
        let settings = await SiteSetting.findOne();

        if (!settings) {
            settings = await SiteSetting.create({});
        }

        return res.status(200).json({
            success: true,
            settings,
        });
    } catch (error) {
        console.error("Get Site Settings Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to load site settings.",
            error: error.message,
        });
    }
};

const updateSiteSettings = async (req, res) => {
    try {
        const updateData = {};

        allowedFields.forEach((field) => {
            if (
                Object.prototype.hasOwnProperty.call(
                    req.body,
                    field
                )
            ) {
                updateData[field] = req.body[field];
            }
        });

        const existingSettings = await SiteSetting.findOne();

        if (req.files?.logo?.[0]) {
            updateData.logo = getImageUrl(req.files.logo[0]);
        }

        if (req.files?.favicon?.[0]) {
            updateData.favicon = getImageUrl(req.files.favicon[0]);
        }

        const settings = await SiteSetting.findOneAndUpdate(
            {},
            {
                $set: updateData,
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        if (existingSettings) {
            if (req.files?.logo?.[0] && existingSettings.logo) {
                deleteOldImage(existingSettings.logo);
            }

            if (
                req.files?.favicon?.[0] &&
                existingSettings.favicon
            ) {
                deleteOldImage(existingSettings.favicon);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Site settings updated successfully.",
            settings,
        });
    } catch (error) {
        console.error("Update Site Settings Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update site settings.",
            error: error.message,
        });
    }
};

module.exports = {
    getSiteSettings,
    updateSiteSettings,
};

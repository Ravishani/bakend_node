
const express = require("express");
const router = express.Router();

const {
    getSiteSettings,
    updateSiteSettings,
} = require("../controllers/siteSettingController");

const {
    protect,
    adminOnly,
} = require("../middleware/authMiddleware");

const uploadSiteSettings = require("../middleware/uploadSiteSettings");

// Validate controller exports
if (typeof getSiteSettings !== "function") {
    throw new Error(
        "getSiteSettings is not exported correctly from siteSettingController.js"
    );
}

if (typeof updateSiteSettings !== "function") {
    throw new Error(
        "updateSiteSettings is not exported correctly from siteSettingController.js"
    );
}

// Validate middleware exports
if (typeof protect !== "function") {
    throw new Error(
        "protect middleware is not exported correctly from authMiddleware.js"
    );
}

if (typeof adminOnly !== "function") {
    throw new Error(
        "adminOnly middleware is not exported correctly from authMiddleware.js"
    );
}

// Validate upload middleware
if (
    !uploadSiteSettings ||
    typeof uploadSiteSettings.fields !== "function"
) {
    throw new Error(
        "uploadSiteSettings must be a valid Multer middleware"
    );
}

// PUBLIC: Frontend Site Settings
router.get("/public", getSiteSettings);

// ADMIN: Get Site Settings
router.get(
    "/",
    protect,
    adminOnly,
    getSiteSettings
);

// ADMIN: Update Site Settings
router.put(
    "/",
    protect,
    adminOnly,
    uploadSiteSettings.fields([
        { name: "logo", maxCount: 1 },
        { name: "favicon", maxCount: 1 },
    ]),
    updateSiteSettings
);

module.exports = router;

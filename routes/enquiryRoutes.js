const express = require("express");
const router = express.Router();

const {
    getAllEnquiries,
    getEnquiryById,
    updateEnquiry,
    toggleEnquiryRead,
    deleteEnquiry,
} = require("../controllers/enquiryController");

// Import your existing admin authentication middleware here.
// Example:
// const { protectAdmin } = require("../middleware/adminAuth");

// Apply your existing admin authentication middleware to all routes.
// router.use(protectAdmin);

router.get("/", getAllEnquiries);

router.get("/:id", getEnquiryById);

router.put("/:id", updateEnquiry);

router.patch("/:id/read", toggleEnquiryRead);

router.delete("/:id", deleteEnquiry);

module.exports = router;
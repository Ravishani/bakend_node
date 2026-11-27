
const express = require("express");
const router = express.Router();

const visitorController = require("../controllers/visitorController");
const adminAuth = require("../middleware/adminAuth");

router.post("/page", visitorController.trackPage);

router.get("/analytics", adminAuth, visitorController.getAnalytics);
router.get("/logs", adminAuth, visitorController.getVisitors);
router.delete("/:id", adminAuth, visitorController.deleteVisitor);

module.exports = router;


const express = require("express");
const router = express.Router();

const {
    getServices,
    getServiceById,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
} = require("../controllers/serviceController");

const {
    protect,
    adminOnly,
} = require("../middleware/authMiddleware");

const {
    serviceUpload,
} = require("../middleware/uploadMiddleware");

router.get("/", getServices);

router.get("/slug/:slug", getServiceBySlug);

router.get("/:id", getServiceById);

router.post(
    "/",
    protect,
    adminOnly,
    serviceUpload,
    createService
);

router.put(
    "/:id",
    protect,
    adminOnly,
    serviceUpload,
    updateService
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteService
);

module.exports = router;

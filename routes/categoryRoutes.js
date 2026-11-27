
const express = require("express");
const router = express.Router();

const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} = require("../controllers/categoryController");

const {
    protect,
    adminOnly,
} = require("../middleware/authMiddleware");

const categoryUpload = require("../middleware/categoryUpload");

// Get all categories
router.get("/", getCategories);

// Get single category
router.get("/:id", getCategoryById);

// Create category with image upload
router.post(
    "/",
    protect,
    adminOnly,
    categoryUpload.single("image"),
    createCategory
);

// Update category with image upload
router.put(
    "/:id",
    protect,
    adminOnly,
    categoryUpload.single("image"),
    updateCategory
);

// Delete category
router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteCategory
);

module.exports = router;

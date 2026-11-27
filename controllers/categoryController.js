
const Category = require("../models/Category");
const fs = require("fs");
const path = require("path");

const generateSlug = (value) => {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
};

const parseStatus = (value, defaultValue = true) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    return (
        value === true ||
        value === "true" ||
        value === "1" ||
        value === 1
    );
};

const deleteImageFile = (imagePath) => {
    if (!imagePath) return;

    const normalizedPath = String(imagePath).replace(/\\/g, "/");

    if (
        normalizedPath.startsWith("http://") ||
        normalizedPath.startsWith("https://")
    ) {
        return;
    }

    const filename = path.basename(normalizedPath);

    const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "categories",
        filename
    );

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (error) => {
            if (error) {
                console.error("Category image delete error:", error.message);
            }
        });
    }
};

const isValidId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(String(id || ""));
};

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .sort({ sortOrder: 1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: categories.length,
            data: categories,
        });
    } catch (error) {
        console.error("Get Categories Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// GET SINGLE CATEGORY
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error("Get Category Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// CREATE CATEGORY
const createCategory = async (req, res) => {
    try {
        const body = req.body || {};

        const name = String(body.name || "").trim();
        const slug = generateSlug(body.slug || name);

        if (!name) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        if (!slug) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Valid category slug is required",
            });
        }

        const existingCategory = await Category.findOne({
            $or: [
                { name },
                { slug },
            ],
        });

        if (existingCategory) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(409).json({
                success: false,
                message: "Category name or slug already exists",
            });
        }

        const image = req.file
            ? `/uploads/categories/${req.file.filename}`
            : body.image || "";

        const category = await Category.create({
            name,
            slug,
            description: body.description || "",
            icon: body.icon || "IconCategory",
            image,
            status: parseStatus(body.status, true),
            sortOrder: Number(body.sortOrder || 0),
        });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        if (req.file) deleteImageFile(req.file.path);

        console.error("Create Category Error:", error);

        return res.status(error.code === 11000 ? 409 : 500).json({
            success: false,
            message: error.code === 11000
                ? "Category name or slug already exists"
                : error.message,
        });
    }
};

// UPDATE CATEGORY
const updateCategory = async (req, res) => {
    try {
        const body = req.body || {};
        const { id } = req.params;

        if (!isValidId(id)) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const oldImage = category.image;

        const name = body.name !== undefined
            ? String(body.name).trim()
            : category.name;

        if (!name) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        const slug = body.slug !== undefined || body.name !== undefined
            ? generateSlug(body.slug || name)
            : category.slug;

        if (!slug) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Valid category slug is required",
            });
        }

        const duplicateCategory = await Category.findOne({
            _id: { $ne: category._id },
            $or: [
                { name },
                { slug },
            ],
        });

        if (duplicateCategory) {
            if (req.file) deleteImageFile(req.file.path);

            return res.status(409).json({
                success: false,
                message: "Category name or slug already exists",
            });
        }

        category.name = name;
        category.slug = slug;

        if (body.description !== undefined) {
            category.description = body.description;
        }

        if (body.icon !== undefined) {
            category.icon = body.icon;
        }

        if (body.status !== undefined) {
            category.status = parseStatus(body.status);
        }

        if (body.sortOrder !== undefined) {
            category.sortOrder = Number(body.sortOrder || 0);
        }

        if (req.file) {
            category.image = `/uploads/categories/${req.file.filename}`;
        } else if (
            body.removeImage === "true" ||
            body.removeImage === true
        ) {
            category.image = "";
        } else if (body.image !== undefined) {
            category.image = body.image;
        }

        await category.save();

        if (category.image !== oldImage && oldImage) {
            deleteImageFile(oldImage);
        }

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        if (req.file) deleteImageFile(req.file.path);

        console.error("Update Category Error:", error);

        return res.status(error.code === 11000 ? 409 : 500).json({
            success: false,
            message: error.code === 11000
                ? "Category name or slug already exists"
                : error.message,
        });
    }
};

// DELETE CATEGORY
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const image = category.image;

        await category.deleteOne();

        if (image) {
            deleteImageFile(image);
        }

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete Category Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};

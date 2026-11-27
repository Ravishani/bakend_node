
const express = require("express");
const router = express.Router();

const {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
} = require("../controllers/userController");

const {
    protect,
    adminOnly,
} = require("../middleware/authMiddleware");

// Get all users
router.get("/", protect, adminOnly, getUsers);

// Create new user
router.post("/", protect, adminOnly, createUser);

// Update user
router.put("/:id", protect, adminOnly, updateUser);

// Delete user
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;


const mongoose = require("mongoose");
const User = require("../models/User");

const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .lean();

        const formattedUsers = users.map((user) => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            mobile: user.mobile || "",
            role: user.role,
            status: user.status === 1 ? "Active" : "Inactive",
            joined: user.createdAt
                ? new Date(user.createdAt).toISOString().split("T")[0]
                : "",
        }));

        return res.status(200).json({
            success: true,
            message: "Users fetched successfully",
            total: formattedUsers.length,
            users: formattedUsers,
        });
    } catch (error) {
        console.error("Get Users Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

// Create User
const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            password,
            role,
            status,
        } = req.body;

        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered",
            });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            mobile: mobile?.trim() || null,
            password,
            role: role === "admin" ? "admin" : "user",
            status: Number(status) === 0 ? 0 : 1,
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                mobile: user.mobile || "",
                role: user.role,
                status: user.status === 1 ? "Active" : "Inactive",
                joined: user.createdAt
                    ? new Date(user.createdAt).toISOString().split("T")[0]
                    : "",
            },
        });
    } catch (error) {
        console.error("Create User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create user",
        });
    }
};

// Update User
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            email,
            mobile,
            password,
            role,
            status,
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
        }

        if (password && password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters",
            });
        }

        const user = await User.findById(id).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: id },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered",
            });
        }

        user.name = name.trim();
        user.email = normalizedEmail;
        user.mobile = mobile?.trim() || null;
        user.role = role === "admin" ? "admin" : "user";
        user.status = Number(status) === 0 ? 0 : 1;

        // Update password only when a new password is provided.
        if (password?.trim()) {
            user.password = password;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                mobile: user.mobile || "",
                role: user.role,
                status: user.status === 1 ? "Active" : "Inactive",
                joined: user.createdAt
                    ? new Date(user.createdAt).toISOString().split("T")[0]
                    : "",
            },
        });
    } catch (error) {
        console.error("Update User Error:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email address is already registered",
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
};

// Delete User
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (req.user._id.toString() === id) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete your own account",
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Delete User Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
};

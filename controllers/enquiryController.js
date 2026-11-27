const mongoose = require("mongoose");
const Enquiry = require("../models/Enquiry");

const allowedStatuses = [
    "new",
    "contacted",
    "in-progress",
    "completed",
    "cancelled",
];

// Get all enquiries
exports.getAllEnquiries = async (req, res) => {
    try {
        const {
            search = "",
            status = "",
            page = 1,
            limit = 20,
        } = req.query;

        const currentPage = Math.max(parseInt(page, 10) || 1, 1);
        const perPage = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        const filter = {};

        if (status && allowedStatuses.includes(status)) {
            filter.status = status;
        }

        if (search.trim()) {
            const regex = new RegExp(
                search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            filter.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
                { fullPhone: regex },
                { company: regex },
                { service: regex },
                { message: regex },
            ];
        }

        const [enquiries, total, counts] = await Promise.all([
            Enquiry.find(filter)
                .populate("serviceId", "title name")
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
                .lean(),

            Enquiry.countDocuments(filter),

            Enquiry.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const statusCounts = {
            new: 0,
            contacted: 0,
            "in-progress": 0,
            completed: 0,
            cancelled: 0,
        };

        counts.forEach((item) => {
            statusCounts[item._id] = item.count;
        });

        const unreadCount = await Enquiry.countDocuments({ isRead: false });

        return res.status(200).json({
            success: true,
            message: "Enquiries fetched successfully",
            enquiries,
            pagination: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(total / perPage),
            },
            counts: {
                total: await Enquiry.countDocuments(),
                unread: unreadCount,
                statuses: statusCounts,
            },
        });
    } catch (error) {
        console.error("Get enquiries error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch enquiries",
        });
    }
};

// Get single enquiry
exports.getEnquiryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry ID",
            });
        }

        const enquiry = await Enquiry.findById(id).populate(
            "serviceId",
            "title name"
        );

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        enquiry.isRead = true;
        await enquiry.save();

        return res.status(200).json({
            success: true,
            message: "Enquiry fetched successfully",
            enquiry,
        });
    } catch (error) {
        console.error("Get enquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch enquiry",
        });
    }
};

// Update enquiry status and admin note
exports.updateEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNote, isRead } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry ID",
            });
        }

        const updateData = {};

        if (status !== undefined) {
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid enquiry status",
                });
            }

            updateData.status = status;
        }

        if (adminNote !== undefined) {
            if (typeof adminNote !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Admin note must be a string",
                });
            }

            updateData.adminNote = adminNote.trim();
        }

        if (isRead !== undefined) {
            if (typeof isRead !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "isRead must be true or false",
                });
            }

            updateData.isRead = isRead;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update",
            });
        }

        const enquiry = await Enquiry.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("serviceId", "title name");

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Enquiry updated successfully",
            enquiry,
        });
    } catch (error) {
        console.error("Update enquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update enquiry",
        });
    }
};

// Mark enquiry as read or unread
exports.toggleEnquiryRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { isRead } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry ID",
            });
        }

        if (typeof isRead !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isRead must be true or false",
            });
        }

        const enquiry = await Enquiry.findByIdAndUpdate(
            id,
            { $set: { isRead } },
            { new: true }
        );

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: isRead
                ? "Enquiry marked as read"
                : "Enquiry marked as unread",
            enquiry,
        });
    } catch (error) {
        console.error("Toggle enquiry read error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update read status",
        });
    }
};

// Delete enquiry
exports.deleteEnquiry = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid enquiry ID",
            });
        }

        const enquiry = await Enquiry.findByIdAndDelete(id);

        if (!enquiry) {
            return res.status(404).json({
                success: false,
                message: "Enquiry not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Enquiry deleted successfully",
        });
    } catch (error) {
        console.error("Delete enquiry error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete enquiry",
        });
    }
};
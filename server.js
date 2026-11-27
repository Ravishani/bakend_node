
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const siteSettingRoutes = require("./routes/siteSettingRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

const legacyUploadsDirectory = path.join(__dirname, "uploads");

const publicUploadsDirectory = path.join(
    __dirname,
    "public",
    "uploads"
);

const serviceDirectories = [
    path.join(publicUploadsDirectory, "services", "image"),
    path.join(publicUploadsDirectory, "services", "banner"),
    path.join(publicUploadsDirectory, "services", "og"),
];

fs.mkdirSync(legacyUploadsDirectory, { recursive: true });
fs.mkdirSync(publicUploadsDirectory, { recursive: true });

serviceDirectories.forEach((directory) => {
    fs.mkdirSync(directory, { recursive: true });
});

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
    "/uploads",
    express.static(legacyUploadsDirectory)
);

app.use(
    "/uploads",
    express.static(publicUploadsDirectory)
);

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "GlobalTechNext Backend API Running Successfully",
        status: "Active",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/site-settings", siteSettingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

app.use((error, req, res, next) => {
    console.error("API Error:", error);

    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message:
                error.code === "LIMIT_FILE_SIZE"
                    ? "Image size must not exceed 2 MB."
                    : error.message,
        });
    }

    return res.status(error.status || 500).json({
        success: false,
        message: error.message || "Internal server error.",
    });
});

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("-----------------------------------");
            console.log("GlobalTechNext Backend Started");
            console.log(`Server: http://localhost:${PORT}`);
            console.log("MongoDB: Connected Successfully");
            console.log(`Legacy Uploads: http://localhost:${PORT}/uploads`);
            console.log("Service Main Images: /uploads/services/image");
            console.log("Service Banner Images: /uploads/services/banner");
            console.log("Service OG Images: /uploads/services/og");
            console.log("-----------------------------------");
        });
    } catch (error) {
        console.error("Server Startup Failed:", error.message);
        process.exit(1);
    }
};

startServer();


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
const enquiryRoutes = require("./routes/enquiryRoutes");

const visitorRoutes = require("./routes/visitorRoutes");
const trackVisitor = require("./middleware/trackVisitor");

const app = express();

const PORT = process.env.PORT || 5000;

// Reverse proxy configuration
app.set("trust proxy", 1);
const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://globaltechnext.com",
    "https://www.globaltechnext.com",
];

const configuredOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const finalAllowedOrigins = [
    ...new Set([...allowedOrigins, ...configuredOrigins]),
];

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

// CORS Configuration
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || finalAllowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            console.error("Blocked CORS Origin:", origin);

            return callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Accept",
            "X-Visitor-Session",
        ],
    })
);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static Uploads
app.use(
    "/uploads",
    express.static(legacyUploadsDirectory)
);

app.use(
    "/uploads",
    express.static(publicUploadsDirectory)
);

// Backend Health Check
app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "GlobalTechNext Backend API Running Successfully",
        status: "Active",
        environment: process.env.NODE_ENV || "development",
    });
});

// Visitor Tracking Middleware
app.use(trackVisitor);

// Visitor Tracking Routes
app.use("/api/visitors", visitorRoutes);

// Existing API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/site-settings", siteSettingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/enquiries", enquiryRoutes);

// 404 Handler
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API route not found",
    });
});

// Global Error Handler
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

// Start Server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log("-----------------------------------");
            console.log("GlobalTechNext Backend Started");
            console.log(`Port: ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
            console.log("MongoDB: Connected Successfully");
            console.log("Visitor Tracking: Enabled");
            console.log("Allowed Origins:");

            finalAllowedOrigins.forEach((origin) => {
                console.log(`- ${origin}`);
            });

            console.log("-----------------------------------");
        });
    } catch (error) {
        console.error("Server Startup Failed:", error.message);
        process.exit(1);
    }
};

startServer();

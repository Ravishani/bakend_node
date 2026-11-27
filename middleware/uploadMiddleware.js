
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = path.join(
    __dirname,
    "../public/uploads/services"
);

const uploadDirectories = {
    image: path.join(uploadPath, "image"),
    bannerImage: path.join(uploadPath, "banner"),
    ogImage: path.join(uploadPath, "og"),
};

Object.values(uploadDirectories).forEach((directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationPath = uploadDirectories[file.fieldname];

        if (!destinationPath) {
            return cb(new Error("Invalid upload field."));
        }

        cb(null, destinationPath);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        const filename = `${file.fieldname}-${Date.now()}-${Math.round(
            Math.random() * 1e9
        )}${extension}`;

        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            )
        );
    }
};

const uploadService = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 3,
    },
});

const serviceUpload = (req, res, next) => {
    uploadService.fields([
        { name: "image", maxCount: 1 },
        { name: "bannerImage", maxCount: 1 },
        { name: "ogImage", maxCount: 1 },
    ])(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message:
                    error.code === "LIMIT_FILE_SIZE"
                        ? "Image size must not exceed 5MB."
                        : error.code === "LIMIT_UNEXPECTED_FILE"
                            ? `Unexpected image field: ${error.field}`
                            : error.message,
            });
        }

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Image upload failed.",
            });
        }

        next();
    });
};

module.exports = {
    serviceUpload,
    uploadDirectories,
};

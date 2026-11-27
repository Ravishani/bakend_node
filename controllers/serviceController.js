
const Service = require("../models/Service");
const fs = require("fs");
const path = require("path");

const serviceUploadDirectory = path.resolve(
    __dirname,
    "..",
    "public",
    "uploads",
    "services"
);

const imageDirectories = {
    image: path.join(serviceUploadDirectory, "image"),
    bannerImage: path.join(serviceUploadDirectory, "banner"),
    ogImage: path.join(serviceUploadDirectory, "og"),
};

Object.values(imageDirectories).forEach((directory) => {
    fs.mkdirSync(directory, { recursive: true });
});

const generateSlug = (value) => {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
};

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (typeof value === "boolean") {
        return value;
    }

    return ["true", "1", "yes", "on"].includes(
        String(value).toLowerCase().trim()
    );
};

const parseArray = (value, defaultValue = []) => {
    if (value === undefined || value === null || value === "") {
        return defaultValue;
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {
        const trimmedValue = value.trim();

        if (!trimmedValue) return defaultValue;

        try {
            const parsed = JSON.parse(trimmedValue);

            if (Array.isArray(parsed)) {
                return parsed;
            }

            if (parsed && typeof parsed === "object") {
                return Object.values(parsed);
            }

            return parsed === null ? defaultValue : [parsed];
        } catch {
            return trimmedValue
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
        }
    }

    if (typeof value === "object") {
        return Object.values(value);
    }

    return defaultValue;
};

const parseStringArray = (value) => {
    return parseArray(value)
        .map((item) => {
            if (typeof item === "string" || typeof item === "number") {
                return String(item).trim();
            }

            if (item && typeof item === "object") {
                const namedValue =
                    item.name ||
                    item.value ||
                    item.title;

                if (namedValue) {
                    return String(namedValue).trim();
                }

                const keys = Object.keys(item);

                if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
                    return keys
                        .sort((a, b) => Number(a) - Number(b))
                        .map((key) => item[key])
                        .join("")
                        .trim();
                }
            }

            return "";
        })
        .filter(Boolean);
};

const parseObjectArray = (value, fields = []) => {
    return parseArray(value)
        .filter(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item)
        )
        .map((item) => {
            const result = {};

            fields.forEach((field) => {
                result[field] = String(item[field] ?? "").trim();
            });

            return result;
        });
};

const getSafeImagePath = (imagePath) => {
    if (!imagePath) return null;

    const normalizedPath = String(imagePath)
        .split("?")[0]
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

    if (!normalizedPath.startsWith("uploads/services/")) {
        return null;
    }

    const publicDirectory = path.resolve(
        __dirname,
        "..",
        "public"
    );

    const fullPath = path.resolve(
        publicDirectory,
        normalizedPath
    );

    const relativePath = path.relative(
        serviceUploadDirectory,
        fullPath
    );

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        return null;
    }

    return fullPath;
};

const deleteImageFile = (imagePath) => {
    if (!imagePath) return;

    try {
        const filePath = getSafeImagePath(imagePath);

        if (!filePath) return;

        if (
            fs.existsSync(filePath) &&
            fs.statSync(filePath).isFile()
        ) {
            fs.unlinkSync(filePath);
            console.log("Service image deleted:", filePath);
        }
    } catch (error) {
        console.error("Service image deletion error:", error.message);
    }
};

const getUploadedImage = (req, fieldName) => {
    const file = req.files?.[fieldName]?.[0];

    if (!file) return null;

    if (!file.filename) {
        throw new Error(
            `Uploaded file name missing for ${fieldName}.`
        );
    }

    const folderMap = {
        image: "image",
        bannerImage: "banner",
        ogImage: "og",
    };

    const folder = folderMap[fieldName];

    if (!folder) {
        throw new Error(`Invalid image field: ${fieldName}`);
    }

    const expectedDirectory = imageDirectories[fieldName];

    const actualPath = file.path
        ? path.resolve(file.path)
        : path.join(expectedDirectory, file.filename);

    const relativePath = path.relative(
        expectedDirectory,
        actualPath
    );

    if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Invalid upload location for ${fieldName}.`
        );
    }

    if (
        !fs.existsSync(actualPath) ||
        !fs.statSync(actualPath).isFile()
    ) {
        throw new Error(
            `Uploaded image was not found on disk: ${actualPath}`
        );
    }

    console.log("Service image uploaded:", {
        field: fieldName,
        filename: file.filename,
        path: actualPath,
        size: file.size,
    });

    return `/uploads/services/${folder}/${file.filename}`;
};

const deleteNewUploads = (req) => {
    if (!req.files) return;

    Object.values(req.files).forEach((files) => {
        if (!Array.isArray(files)) return;

        files.forEach((file) => {
            if (!file?.path) return;

            try {
                const actualPath = path.resolve(file.path);

                const relativePath = path.relative(
                    serviceUploadDirectory,
                    actualPath
                );

                if (
                    relativePath.startsWith("..") ||
                    path.isAbsolute(relativePath)
                ) {
                    return;
                }

                if (
                    fs.existsSync(actualPath) &&
                    fs.statSync(actualPath).isFile()
                ) {
                    fs.unlinkSync(actualPath);
                    console.log("New upload cleaned:", actualPath);
                }
            } catch (error) {
                console.error(
                    "New upload cleanup error:",
                    error.message
                );
            }
        });
    });
};

const generateUniqueSlug = async (value, excludeId = null) => {
    const baseSlug = generateSlug(value) || "service";

    let slug = baseSlug;
    let counter = 1;

    while (true) {
        const query = { slug };

        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await Service.findOne(query).select("_id");

        if (!existing) {
            return slug;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
    }
};

const buildServiceData = (body) => {
    const data = {};

    const stringFields = [
        "name",
        "tagline",
        "shortDescription",
        "description",
        "icon",
        "link",
        "imageAlt",
        "bannerAlt",
        "metaTitle",
        "metaDescription",
        "focusKeyword",
        "keywords",
        "canonicalUrl",
        "ogTitle",
        "ogDescription",
        "ctaTitle",
        "ctaDescription",
        "ctaButtonText",
        "ctaButtonUrl",
    ];

    stringFields.forEach((field) => {
        if (body[field] !== undefined) {
            data[field] = String(body[field] ?? "").trim();
        }
    });

    if (body.slug !== undefined) {
        data.slug = generateSlug(body.slug);
    }

    if (body.categoryId !== undefined) {
        data.categoryId = String(body.categoryId || "").trim() || null;
    }

    if (body.sortOrder !== undefined) {
        const sortOrder = Number(body.sortOrder);

        data.sortOrder =
            Number.isFinite(sortOrder) && sortOrder >= 0
                ? sortOrder
                : 0;
    }

    if (body.status !== undefined) {
        data.status = parseBoolean(body.status, true);
    }

    if (body.featured !== undefined) {
        data.featured = parseBoolean(body.featured);
    }

    if (body.publishedAt !== undefined) {
        if (!body.publishedAt) {
            data.publishedAt = null;
        } else {
            const date = new Date(body.publishedAt);

            if (!Number.isNaN(date.getTime())) {
                data.publishedAt = date;
            }
        }
    }

    if (body.features !== undefined) {
        data.features = parseObjectArray(body.features, [
            "title",
            "description",
            "icon",
        ]);
    }

    if (body.benefits !== undefined) {
        data.benefits = parseObjectArray(body.benefits, [
            "title",
            "description",
            "icon",
        ]);
    }

    if (body.process !== undefined) {
        data.process = parseObjectArray(body.process, [
            "title",
            "description",
            "duration",
        ]);
    }

    if (body.faqs !== undefined) {
        data.faqs = parseObjectArray(body.faqs, [
            "question",
            "answer",
        ]);
    }

    if (body.technologies !== undefined) {
        data.technologies = parseStringArray(body.technologies);
    }

    return data;
};

const handleError = (res, error) => {
    console.error("Service Controller Error:", error);

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "A service with this slug already exists.",
        });
    }

    if (error.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }

    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid value for ${error.path || "service field"}.`,
        });
    }

    return res.status(500).json({
        success: false,
        message:
            error.message ||
            "Something went wrong while processing the service.",
        error:
            process.env.NODE_ENV === "development"
                ? error.stack
                : undefined,
    });
};

const formatService = (service) => {
    const item = service.toObject
        ? service.toObject()
        : service;

    return {
        ...item,
        id: item._id,
        categoryName: item.categoryId?.name || "",
    };
};

const getServices = async (req, res) => {
    try {
        const services = await Service.find()
            .populate("categoryId", "name slug")
            .sort({ sortOrder: 1, createdAt: -1 })
            .lean();

        const formattedServices = services.map((service) => ({
            ...service,
            id: service._id,
            categoryName: service.categoryId?.name || "",
        }));

        return res.status(200).json({
            success: true,
            count: formattedServices.length,
            services: formattedServices,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id)
            .populate("categoryId", "name slug");

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found.",
            });
        }

        return res.status(200).json({
            success: true,
            service: formatService(service),
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const getServiceBySlug = async (req, res) => {
    try {
        const service = await Service.findOne({
            slug: req.params.slug,
            status: true,
        }).populate("categoryId", "name slug");

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found.",
            });
        }

        return res.status(200).json({
            success: true,
            service: formatService(service),
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const createService = async (req, res) => {
    try {
        console.log("Service upload directory:", serviceUploadDirectory);
        console.log("Service request files:", req.files);

        const data = buildServiceData(req.body);

        if (!data.name || !data.name.trim()) {
            deleteNewUploads(req);

            return res.status(400).json({
                success: false,
                message: "Service name is required.",
            });
        }

        data.slug = await generateUniqueSlug(
            data.slug || data.name
        );

        data.image = getUploadedImage(req, "image") || "";
        data.bannerImage = getUploadedImage(req, "bannerImage") || "";
        data.ogImage = getUploadedImage(req, "ogImage") || "";

        const service = await Service.create(data);

        console.log("Service created:", {
            id: service._id,
            image: service.image,
            bannerImage: service.bannerImage,
            ogImage: service.ogImage,
        });

        return res.status(201).json({
            success: true,
            message: "Service created successfully.",
            service: formatService(service),
        });
    } catch (error) {
        deleteNewUploads(req);
        return handleError(res, error);
    }
};

const updateService = async (req, res) => {
    try {
        console.log("Service upload directory:", serviceUploadDirectory);
        console.log("Service request files:", req.files);

        const service = await Service.findById(req.params.id);

        if (!service) {
            deleteNewUploads(req);

            return res.status(404).json({
                success: false,
                message: "Service not found.",
            });
        }

        const data = buildServiceData(req.body);

        if (
            data.name !== undefined &&
            !data.name.trim()
        ) {
            deleteNewUploads(req);

            return res.status(400).json({
                success: false,
                message: "Service name is required.",
            });
        }

        if (req.body.slug !== undefined || data.name !== undefined) {
            data.slug = await generateUniqueSlug(
                data.slug || data.name || service.name,
                service._id
            );
        }

        const oldImages = {
            image: service.image,
            bannerImage: service.bannerImage,
            ogImage: service.ogImage,
        };

        const imagesToDelete = [];

        const imageFields = [
            {
                field: "image",
                removeFlag: "removeImage",
            },
            {
                field: "bannerImage",
                removeFlag: "removeBannerImage",
            },
            {
                field: "ogImage",
                removeFlag: "removeOgImage",
            },
        ];

        imageFields.forEach(({ field, removeFlag }) => {
            const newImage = getUploadedImage(req, field);
            const shouldRemove = parseBoolean(req.body[removeFlag]);

            if (newImage) {
                data[field] = newImage;

                if (oldImages[field]) {
                    imagesToDelete.push(oldImages[field]);
                }
            } else if (shouldRemove) {
                data[field] = "";

                if (oldImages[field]) {
                    imagesToDelete.push(oldImages[field]);
                }
            }
        });

        Object.assign(service, data);

        await service.save();

        imagesToDelete.forEach((image) => {
            deleteImageFile(image);
        });

        console.log("Service updated:", {
            id: service._id,
            image: service.image,
            bannerImage: service.bannerImage,
            ogImage: service.ogImage,
        });

        return res.status(200).json({
            success: true,
            message: "Service updated successfully.",
            service: formatService(service),
        });
    } catch (error) {
        deleteNewUploads(req);
        return handleError(res, error);
    }
};

const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found.",
            });
        }

        const images = [
            service.image,
            service.bannerImage,
            service.ogImage,
        ];

        await service.deleteOne();

        images.forEach((image) => {
            deleteImageFile(image);
        });

        return res.status(200).json({
            success: true,
            message: "Service deleted successfully.",
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    getServices,
    getServiceById,
    getServiceBySlug,
    createService,
    updateService,
    deleteService,
};

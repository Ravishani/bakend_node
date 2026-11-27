
const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        icon: {
            type: String,
            default: "IconCheck",
        },
    },
    { _id: true }
);

const benefitSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        icon: {
            type: String,
            default: "IconStar",
        },
    },
    { _id: true }
);

const processSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: "",
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        duration: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: true }
);

const faqSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            trim: true,
            default: "",
        },
        answer: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { _id: true }
);

const normalizeTechnologies = (value) => {
    if (value === undefined || value === null || value === "") {
        return [];
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            if (Array.isArray(parsed)) {
                value = parsed;
            } else if (parsed && typeof parsed === "object") {
                value = Object.values(parsed);
            } else {
                value = [parsed];
            }
        } catch {
            value = value.split(",");
        }
    }

    if (!Array.isArray(value) && typeof value === "object") {
        value = Object.values(value);
    }

    if (!Array.isArray(value)) {
        value = [value];
    }

    return value
        .map((item) => {
            if (typeof item === "string" || typeof item === "number") {
                return String(item).trim();
            }

            if (item && typeof item === "object") {
                return String(
                    item.name ||
                    item.value ||
                    item.title ||
                    ""
                ).trim();
            }

            return "";
        })
        .filter(Boolean);
};

const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Service name is required."],
            trim: true,
            maxlength: 120,
        },

        slug: {
            type: String,
            required: [true, "Service slug is required."],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 150,
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        tagline: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },

        shortDescription: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },

        icon: {
            type: String,
            default: "IconCode",
        },

        image: {
            type: String,
            default: "",
        },

        bannerImage: {
            type: String,
            default: "",
        },

        ogImage: {
            type: String,
            default: "",
        },

        imageAlt: {
            type: String,
            trim: true,
            default: "",
        },

        bannerAlt: {
            type: String,
            trim: true,
            default: "",
        },

        link: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: Boolean,
            default: true,
        },

        sortOrder: {
            type: Number,
            default: 0,
            min: 0,
        },

        featured: {
            type: Boolean,
            default: false,
        },

        publishedAt: {
            type: Date,
            default: null,
        },

        features: {
            type: [featureSchema],
            default: [],
        },

        benefits: {
            type: [benefitSchema],
            default: [],
        },

        process: {
            type: [processSchema],
            default: [],
        },

        technologies: {
            type: [String],
            default: [],
            set: normalizeTechnologies,
        },

        faqs: {
            type: [faqSchema],
            default: [],
        },

        metaTitle: {
            type: String,
            trim: true,
            maxlength: 70,
            default: "",
        },

        metaDescription: {
            type: String,
            trim: true,
            maxlength: 170,
            default: "",
        },

        focusKeyword: {
            type: String,
            trim: true,
            default: "",
        },

        keywords: {
            type: String,
            trim: true,
            default: "",
        },

        canonicalUrl: {
            type: String,
            trim: true,
            default: "",
        },

        ogTitle: {
            type: String,
            trim: true,
            default: "",
        },

        ogDescription: {
            type: String,
            trim: true,
            default: "",
        },

        ctaTitle: {
            type: String,
            trim: true,
            default: "",
        },

        ctaDescription: {
            type: String,
            trim: true,
            default: "",
        },

        ctaButtonText: {
            type: String,
            trim: true,
            default: "Get Started",
        },

        ctaButtonUrl: {
            type: String,
            trim: true,
            default: "/contact",
        },
    },
    {
        timestamps: true,
    }
);

serviceSchema.index({ status: 1, sortOrder: 1 });
serviceSchema.index({ categoryId: 1 });
serviceSchema.index({ featured: 1 });
serviceSchema.index({
    name: "text",
    shortDescription: "text",
    description: "text",
});

module.exports = mongoose.model("Service", serviceSchema);

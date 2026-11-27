
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
        },

        slug: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        icon: {
            type: String,
            default: "IconCategory",
            trim: true,
        },

        image: {
            type: String,
            default: "",
            trim: true,
        },

        status: {
            type: Boolean,
            default: true,
        },

        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

categorySchema.pre("validate", function () {
    if (this.name && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    }
});

module.exports = mongoose.model("Category", categorySchema);

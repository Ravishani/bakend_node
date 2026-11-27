
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 150
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false
        },

        mobile: {
            type: String,
            default: null,
            trim: true
        },

        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user"
        },

        status: {
            type: Number,
            enum: [0, 1],
            default: 1
        },

        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        collection: "users"
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model("User", userSchema);


require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const seedAdmin = async () => {
    try {
        const name = process.env.ADMIN_NAME || "Administrator";
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in .env");
        }

        if (password.length < 8) {
            throw new Error("Admin password must be at least 8 characters");
        }

        await connectDB();

        let admin = await User.findOne({ email });

        if (admin) {
            admin.role = "admin";
            admin.status = 1;

            if (name) {
                admin.name = name;
            }

            await admin.save();

            console.log("-----------------------------------");
            console.log("Existing user promoted to Admin");
            console.log(`Email: ${admin.email}`);
            console.log("-----------------------------------");
        } else {
            admin = await User.create({
                name,
                email,
                password,
                role: "admin",
                status: 1
            });

            console.log("-----------------------------------");
            console.log("Admin Created Successfully");
            console.log(`Name: ${admin.name}`);
            console.log(`Email: ${admin.email}`);
            console.log("-----------------------------------");
        }

    } catch (error) {
        console.error("Admin Seeder Failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin();

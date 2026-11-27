
const express = require("express");
const router = express.Router();

const Enquiry = require("../models/Enquiry");

router.post("/", async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            countryCode,
            company,
            service,
            serviceId,
            budget,
            message,
        } = req.body;

        if (!name || !email || !phone || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, phone and message are required.",
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = String(phone).replace(/\D/g, "");
        const cleanCountryCode = String(countryCode || "+91").trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email address.",
            });
        }

        if (!/^\+\d{1,4}$/.test(cleanCountryCode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid country code.",
            });
        }

        if (cleanPhone.length < 7 || cleanPhone.length > 15) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number.",
            });
        }

        if (String(message).trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: "Message must contain at least 10 characters.",
            });
        }

        const enquiry = await Enquiry.create({
            name: String(name).trim(),
            email: cleanEmail,
            phone: cleanPhone,
            countryCode: cleanCountryCode,
            fullPhone: `${cleanCountryCode}${cleanPhone}`,
            company: company || "",
            service: service || "",
            serviceId: serviceId || null,
            budget: budget || "",
            message: String(message).trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Enquiry submitted successfully.",
            enquiry,
        });

    } catch (error) {
        console.error("Enquiry Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit enquiry.",
        });
    }
});

module.exports = router;

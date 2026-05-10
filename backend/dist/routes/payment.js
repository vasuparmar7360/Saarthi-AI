"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID || "test_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "test_secret",
});
// Create Order
router.post("/create-order", async (req, res) => {
    try {
        const { userId, applicationId, amount } = req.body; // Amount is usually 15 INR
        const options = {
            amount: amount * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_order_${applicationId}`,
        };
        const order = await razorpay.orders.create(options);
        // Create a payment record
        await prisma_1.default.payment.create({
            data: {
                userId,
                applicationId,
                amount,
                razorpayId: order.id,
                status: "CREATED",
            },
        });
        res.json({ success: true, order });
    }
    catch (error) {
        console.error("Razorpay Create Order Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
// Verify Payment Webhook
router.post("/verify", async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto_1.default
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test_secret")
            .update(sign.toString())
            .digest("hex");
        if (razorpay_signature === expectedSign) {
            // Payment is verified
            await prisma_1.default.payment.updateMany({
                where: { razorpayId: razorpay_order_id },
                data: { status: "SUCCESS" },
            });
            // Also update the application status
            const payment = await prisma_1.default.payment.findFirst({
                where: { razorpayId: razorpay_order_id },
            });
            if (payment) {
                await prisma_1.default.application.update({
                    where: { id: payment.applicationId },
                    data: { status: "PAID" },
                });
            }
            res.json({ success: true, message: "Payment verified successfully" });
        }
        else {
            res.status(400).json({ success: false, message: "Invalid signature" });
        }
    }
    catch (error) {
        console.error("Razorpay Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const twilio_1 = __importDefault(require("twilio"));
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID || "test_sid", process.env.TWILIO_AUTH_TOKEN || "test_token");
// Receive WhatsApp Message
router.post("/webhook", async (req, res) => {
    try {
        const { From, Body } = req.body; // From is usually 'whatsapp:+91...'
        // Look up or create user
        let user = await prisma_1.default.user.findUnique({
            where: { phoneNumber: From },
        });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: { phoneNumber: From },
            });
        }
        // Save message to conversation
        let conversation = await prisma_1.default.conversation.findFirst({
            where: { userId: user.id },
        });
        const newMessage = { role: "user", content: Body, timestamp: new Date().toISOString() };
        if (!conversation) {
            conversation = await prisma_1.default.conversation.create({
                data: {
                    userId: user.id,
                    messages: [newMessage],
                },
            });
        }
        else {
            const messages = conversation.messages;
            messages.push(newMessage);
            await prisma_1.default.conversation.update({
                where: { id: conversation.id },
                data: { messages },
            });
        }
        // Agent response logic would go here
        const aiResponseText = `This is Saarthi AI. I received your message: "${Body}". I am processing it.`;
        // Send WhatsApp response
        await client.messages.create({
            body: aiResponseText,
            from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
            to: From,
        });
        // Save AI response
        const messages = conversation.messages;
        messages.push({ role: "ai", content: aiResponseText, timestamp: new Date().toISOString() });
        await prisma_1.default.conversation.update({
            where: { id: conversation.id },
            data: { messages },
        });
        res.status(200).send("<Response></Response>");
    }
    catch (error) {
        console.error("WhatsApp Webhook Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.default = router;

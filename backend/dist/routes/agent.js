"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
// Endpoint for the web UI chat interface
router.post("/chat", async (req, res) => {
    try {
        const { message, userId } = req.body;
        let user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: {
                    id: userId || "mock-user-id",
                    name: "Demo User",
                    phoneNumber: "9999999999",
                    language: "English",
                },
            });
        }
        // In a real application, you would pass the message to an AI Agent (e.g., using LangChain)
        // The AI Agent would then determine intent, perform RAG, check eligibility, etc.
        // Mock Agent Logic:
        let aiResponseText = `This is Saarthi AI. You asked: "${message}". I am checking eligible schemes for you.`;
        // Save conversation
        let conversation = await prisma_1.default.conversation.findFirst({
            where: { userId: user.id, channel: "WEB" },
        });
        const userMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
        const aiMessage = { role: "ai", content: aiResponseText, timestamp: new Date().toISOString() };
        if (!conversation) {
            await prisma_1.default.conversation.create({
                data: {
                    userId: user.id,
                    channel: "WEB",
                    messages: [userMessage, aiMessage],
                },
            });
        }
        else {
            const messages = conversation.messages;
            messages.push(userMessage, aiMessage);
            await prisma_1.default.conversation.update({
                where: { id: conversation.id },
                data: { messages },
            });
        }
        res.json({ success: true, response: aiResponseText });
    }
    catch (error) {
        console.error("Agent Chat Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});
exports.default = router;

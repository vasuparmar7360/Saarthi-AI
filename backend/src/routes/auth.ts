import { Router } from "express";
import prisma from "../prisma";
import { client as twilioClient, normalizePhone } from "./whatsapp";

const router = Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, phoneNumber, email, role, state, income, password } = req.body;
    console.log("Signup Request:", { name, phoneNumber, email, role, state, income });

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const cleanPhone = normalizePhone(phoneNumber);
    console.log("Normalized Phone:", cleanPhone);

    if (!cleanPhone || !password) {
      return res.status(400).json({ success: false, message: "Phone number and password are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanPhone },
          { email: email || undefined }
        ]
      },
      include: { conversations: true }
    });

    let user;
    if (existingUser) {
      // If user exists but has no password (created via WhatsApp), "claim" it
      if (!existingUser.password && existingUser.phoneNumber === cleanPhone) {
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: { name, email, role, state, income, password },
        });
      } else {
        return res.status(400).json({ success: false, message: "User already exists with this phone or email" });
      }
    } else {
      user = await prisma.user.create({
        data: { name, phoneNumber: cleanPhone, email, role, state, income, password },
      });
    }

    // Send WhatsApp Welcome Message
    try {
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      if (twilioPhone && twilioPhone !== "+1234567890") {
        await twilioClient.messages.create({
          contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
          contentVariables: JSON.stringify({"1": "12/1", "2": "3pm"}),
          from: `whatsapp:${twilioPhone}`,
          to: `whatsapp:${user.phoneNumber}`,
        });
      } else {
        console.log("Skipping WhatsApp welcome: TWILIO_PHONE_NUMBER not configured or is default.");
      }
    } catch (waError) {
      console.error("Failed to send welcome WhatsApp:", waError);
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { id, password } = req.body; // id could be phone or email
    console.log("Login Request:", { id });

    if (!id) return res.status(400).json({ success: false, message: "ID is required" });

    const cleanId = id.includes("@") ? id : normalizePhone(id);
    console.log("Normalized Login ID:", cleanId);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: cleanId },
          { email: id }
        ]
      }
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Send WhatsApp Login Message
    try {
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
      if (twilioPhone && twilioPhone !== "+1234567890") {
        await twilioClient.messages.create({
          contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
          contentVariables: JSON.stringify({"1": "12/1", "2": "3pm"}),
          from: `whatsapp:${twilioPhone}`,
          to: `whatsapp:${user.phoneNumber}`,
        });
      }
    } catch (waError) {
      console.error("Failed to send login WhatsApp:", waError);
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Update Profile
router.post("/update", async (req, res) => {
  try {
    const { userId, name, email, state } = req.body;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email, state },
    });
    res.json({ success: true, user });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;

import { Router } from "express";
import prisma from "../prisma";

const router = Router();

// Get user applications
router.get("/:userId/applications", async (req, res) => {
  try {
    const { userId } = req.params;
    const apps = await prisma.application.findMany({
      where: { userId },
      include: { scheme: true }
    });
    res.json({ success: true, applications: apps });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Get user notifications
router.get("/:userId/notifications", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, notifications: notifs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;

import { Router } from "express";
import prisma from "../prisma";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const schemeCount = await prisma.scheme.count();
    const applicationCount = await prisma.application.count();
    
    // Application stats by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    // Conversation stats by channel
    const conversationsByChannel = await prisma.conversation.groupBy({
      by: ['channel'],
      _count: {
        id: true,
      },
    });

    // Recent conversations
    const recentConversations = await prisma.conversation.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    res.json({
      success: true,
      stats: {
        users: userCount,
        schemes: schemeCount,
        applications: applicationCount,
        applicationsByStatus,
        conversationsByChannel,
        recentConversations,
      },
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;

import { Router } from "express";
import twilio from "twilio";
import prisma from "../prisma";

const router = Router();

// Initialise Twilio client safely
export let client: any;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn("Twilio credentials not provided or invalid. Using mock client.");
  client = {
    messages: {
      create: async (msg: any) => {
        console.log("Mock Twilio message sent:", msg);
        return { sid: "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXX" };
      }
    }
  };
}

export function normalizePhone(phone: any): string {
  if (typeof phone !== "string") return "";
  // Remove 'whatsapp:' prefix and any whitespace/dashes
  return phone.replace("whatsapp:", "").replace(/[\s-]/g, "");
}

// Receive WhatsApp Message
router.post("/webhook", async (req, res) => {
  try {
    const { From, Body } = req.body; 
    const cleanPhone = normalizePhone(From);

    // Look up or create user
    let user = await prisma.user.findUnique({
      where: { phoneNumber: cleanPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phoneNumber: cleanPhone },
      });
    }

    // Save message to conversation
    let conversation = await prisma.conversation.findFirst({
      where: { userId: user.id },
    });

    const newMessage = { role: "user", content: Body, timestamp: new Date().toISOString() };

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: user.id,
          messages: [newMessage],
        },
      });
    } else {
      const messages = conversation.messages as any[];
      messages.push(newMessage);
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { messages },
      });
    }

    const BOT_RESPONSES: Record<string, string> = {
      'pm-kisan': 'PM-KISAN provides ₹6,000 per year (₹2,000 in 3 instalments) to eligible small and marginal farmer families. Eligibility: landholding farmer family with Aadhaar-linked bank account. Apply at pmkisan.gov.in or your nearest CSC centre. 🌾',
      'mudra': 'PM Mudra Yojana offers collateral-free loans: *Shishu* (up to ₹50K), *Kishor* (₹50K–5L), *Tarun* (₹5L–10L). Visit any bank or NBFC. Docs needed: Aadhaar, PAN, 6-month bank statement, business plan. 💼',
      'ayushman': 'Ayushman Bharat–PM JAY covers ₹5 lakh/family/year for hospitalisation. Check eligibility at pmjay.gov.in with your ration card or mobile. Cashless treatment at 25,000+ empanelled hospitals. 🏥',
      'startup': 'To register on Startup India: 1) Incorporate company/LLP 2) Go to startupindia.gov.in 3) Apply for DPIIT Recognition 4) Get tax exemptions, fast-track patents, and access to ₹50L Seed Fund. Timeline: 3–7 working days. 🚀',
      'scholarship': 'National Scholarship Portal (scholarships.gov.in) offers post-matric & merit-cum-means scholarships. Annual income must be below ₹2.5L (varies by scheme). Deadline typically Oct 31. Apply before the cutoff! 🎓',
      'eligible': `Based on your profile as a *${user.role}*, I recommend checking: PM-KISAN (if farming), Ayushman Bharat (health), PM Mudra (business), NSP (if student). Use our *Eligibility Checker* on the website for accurate matching! ✅`,
      'dpiit': 'DPIIT Recognition steps: 1) Incorporate (Pvt Ltd / LLP / OPC) 2) Apply on startupindia.gov.in 3) Fill form with business description, innovation proof 4) Approval in 3–7 days. Benefits: Tax holiday (3 yrs), IP fast-track, easier compliance. 📋',
      'documents': 'Common documents for most schemes: Aadhaar card, PAN card, Bank passbook (first page), Income certificate, Caste certificate (SC/ST/OBC), Residence proof, Passport photo. Specific schemes may need additional docs — check each scheme\'s detail page. 📄',
      'women': '👩 Schemes for women: *Stand-Up India* (₹10L–1Cr loan), *Beti Bachao Beti Padhao*, *PMEGP* (35% subsidy for women), *Gruha Lakshmi* (Karnataka), *Mahila Udyam Nidhi*. Also check state-specific schemes.',
      'seed fund': 'Startup India Seed Fund provides up to ₹20L for POC/prototype and up to ₹50L for market entry, disbursed through selected incubators. Eligibility: DPIIT-recognised startup, less than 2 years old, no Series A. Deadline: 30 Jun 2025. 💰',
    };

    const lq = Body.toLowerCase();
    let aiResponseText = `I am still learning, but you can try asking me about "Ayushman", "Mudra", "Startup", "Scholarship", or "Documents".`;
    
    if (lq.includes('kisan') || lq.includes('farmer')) aiResponseText = BOT_RESPONSES['pm-kisan'];
    else if (lq.includes('mudra')) aiResponseText = BOT_RESPONSES['mudra'];
    else if (lq.includes('ayushman') || lq.includes('health') || lq.includes('hospital')) aiResponseText = BOT_RESPONSES['ayushman'];
    else if (lq.includes('startup') || lq.includes('dpiit')) aiResponseText = BOT_RESPONSES['dpiit'];
    else if (lq.includes('scholarship') || lq.includes('nsp') || lq.includes('study')) aiResponseText = BOT_RESPONSES['scholarship'];
    else if (lq.includes('eligible') || lq.includes('qualify') || lq.includes('which scheme')) aiResponseText = BOT_RESPONSES['eligible'];
    else if (lq.includes('document') || lq.includes('docs') || lq.includes('required')) aiResponseText = BOT_RESPONSES['documents'];
    else if (lq.includes('women') || lq.includes('mahila') || lq.includes('female')) aiResponseText = BOT_RESPONSES['women'];
    else if (lq.includes('seed fund') || lq.includes('grant') || lq.includes('startup fund')) aiResponseText = BOT_RESPONSES['seed fund'];

    // Send WhatsApp response
    await client.messages.create({
      body: aiResponseText,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: From,
    });

    // Save AI response
    const messages = conversation.messages as any[];
    messages.push({ role: "ai", content: aiResponseText, timestamp: new Date().toISOString() });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { messages },
    });

    res.status(200).send("<Response></Response>");
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;

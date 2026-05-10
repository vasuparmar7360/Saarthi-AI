import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import path from "path";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5001;

// Handle favicon.ico to prevent 404 logs
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Serve static files from the frontend workspace
const frontendPath = path.join(__dirname, "../../frontend");
app.use(express.static(frontendPath));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import paymentRoutes from "./routes/payment";
import whatsappRoutes from "./routes/whatsapp";
import agentRoutes from "./routes/agent";
import statsRoutes from "./routes/stats";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";

app.use("/api/payment", paymentRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Saarthi AI Backend is running",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
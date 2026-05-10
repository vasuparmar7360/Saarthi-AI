"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const payment_1 = __importDefault(require("./routes/payment"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const agent_1 = __importDefault(require("./routes/agent"));
app.use("/api/payment", payment_1.default);
app.use("/api/whatsapp", whatsapp_1.default);
app.use("/api/agent", agent_1.default);
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Saarthi AI Backend is running",
    });
});
app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
});

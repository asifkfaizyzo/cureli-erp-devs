import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./src/modules/auth/auth.routes.js";
import shopRoutes from "./src/modules/shop/shop.routes.js";
import pendingRoutes from "./src/modules/pending/pending.routes.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/pending", pendingRoutes);

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

import { sendMail } from "./src/utils/email.js";

app.get("/test-email", async (req, res) => {
  try {
    await sendMail(
      process.env.SMTP_USER,
      "Cureli Test",
      "<h1>Email system working!</h1>"
    );
    res.send("Email sent successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to send email");
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

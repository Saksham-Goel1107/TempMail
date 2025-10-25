import express from "express";
import { isDisposableEmail } from "./utils/emailValidator.js";
import { ENV } from "./config/env.js";
import { arcjetMiddleware } from "./middleware/arcjet.middleware.js";
import helmet from "helmet";
import hpp from "hpp";
import cors from "cors";
import dns from "dns";

const dnsPromises = dns.promises;

const app = express();
const PORT = ENV?.PORT || 3000;

app.use(express.json());
app.use(arcjetMiddleware);
app.set("trust proxy", 1);
app.use(hpp());
app.use(helmet());
app.use(cors());

app.get("/check", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: "Email parameter is required",
        tempmail: null,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        tempmail: null,
      });
    }

    const domain = email.split("@")[1];

    let mxRecords;
    try {
      mxRecords = await dnsPromises.resolveMx(domain);
    } catch (err) {
      return res.status(400).json({
        error: "Email domain has no mail server",
        tempmail: null,
      });
    }
    if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
      return res.status(400).json({
        error: "Email domain has no mail server",
        tempmail: null,
      });
    }

    const isTempMail = await isDisposableEmail(email);

    res.json({
      tempmail: isTempMail,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({
      error: "Internal server error",
      tempmail: null,
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "TempMail Validator API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`TempMail Validator API listening on port ${PORT}`);
});

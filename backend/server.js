import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import residentRoutes from "./routes/residentRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// --------------------------------------------------
// Environment validation
// --------------------------------------------------

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLIENT_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// Stripe validation
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY is not configured. Online payments will not work."
  );
} else if (
  !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_") &&
  !process.env.STRIPE_SECRET_KEY.startsWith("sk_live_")
) {
  console.warn(
    "⚠️ STRIPE_SECRET_KEY does not appear to be a valid Stripe secret key."
  );
}

// --------------------------------------------------
// Paths
// --------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --------------------------------------------------
// Database
// --------------------------------------------------

connectDB();

// --------------------------------------------------
// Express app
// --------------------------------------------------

const app = express();

// --------------------------------------------------
// Security
// --------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// --------------------------------------------------
// Logging
// --------------------------------------------------

app.use(
  morgan(
    process.env.NODE_ENV === "production"
      ? "combined"
      : "dev"
  )
);

// --------------------------------------------------
// Body parsing
// --------------------------------------------------

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// --------------------------------------------------
// Cookies
// --------------------------------------------------

app.use(cookieParser());

// --------------------------------------------------
// Uploaded files
// --------------------------------------------------

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// --------------------------------------------------
// Rate limiting
// --------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/residents", residentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/uploads", uploadRoutes);

// --------------------------------------------------
// Error handling
// --------------------------------------------------

app.use(notFound);
app.use(errorHandler);

// --------------------------------------------------
// Server
// --------------------------------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("========================================");
  console.log("🏨 Hostel Management System");
  console.log("========================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Client: ${process.env.CLIENT_URL}`);
  console.log(
    `💳 Stripe: ${
      process.env.STRIPE_SECRET_KEY
        ? "Configured"
        : "NOT CONFIGURED"
    }`
  );
  console.log("========================================");
});

// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import helmet from "helmet";
// import morgan from "morgan";
// import cookieParser from "cookie-parser";
// import rateLimit from "express-rate-limit";
// import path from "path";
// import { fileURLToPath } from "url";
// import connectDB from "./config/db.js";
// import { notFound, errorHandler } from "./middleware/errorHandler.js";

// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import roomRoutes from "./routes/roomRoutes.js";
// import residentRoutes from "./routes/residentRoutes.js";
// import maintenanceRoutes from "./routes/maintenanceRoutes.js";
// import billingRoutes from "./routes/billingRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";
// import uploadRoutes from "./routes/uploadRoutes.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// dotenv.config();
// connectDB();

// const app = express();

// app.use(
//   helmet({
//     // Allow uploaded images to be requested cross-origin by the Vite dev server
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );
// app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
// app.use(express.json({ limit: "5mb" }));
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// // Serve uploaded maintenance-request images etc.
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// // Basic rate limiting for auth endpoints to slow brute-force attempts
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 50,
//   standardHeaders: true,
//   legacyHeaders: false,
// });
// app.use("/api/auth", authLimiter);

// app.get("/api/health", (req, res) => res.json({ success: true, message: "API is running" }));

// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/rooms", roomRoutes);
// app.use("/api/residents", residentRoutes);
// app.use("/api/maintenance", maintenanceRoutes);
// app.use("/api/billing", billingRoutes);
// app.use("/api/reports", reportRoutes);
// app.use("/api/notifications", notificationRoutes);
// app.use("/api/uploads", uploadRoutes);

// app.use(notFound);
// app.use(errorHandler);


// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

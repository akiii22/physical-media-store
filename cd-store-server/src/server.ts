
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import "./config/supabase";

import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import mediaTypeRoutes from "./routes/mediaTypeRoutes";
import editEmailRoutes from "./routes/editEmailRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://physical-media-store.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as
      // server-to-server requests and health checks.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Physical Media Store is running",
  });
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/media-types", mediaTypeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/email-templates", editEmailRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

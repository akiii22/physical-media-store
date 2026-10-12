import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/supabase"
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes"
import paymentRoutes from "./routes/paymentRoutes"
import userRoutes from "./routes/userRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import mediaTypeRoutes from "./routes/mediaTypeRoutes";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.json({
        message: "Physical Media Store is running"
    })
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/media-types", mediaTypeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes)
app.use("/api/users", userRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

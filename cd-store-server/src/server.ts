import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/supabase"
import productRoutes from "./routes/productRoutes";
import orderRoutes from "./routes/orderRoutes"
import paymentRoutes from "./routes/paymentRoutes"
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
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

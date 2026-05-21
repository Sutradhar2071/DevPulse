import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.route";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DevPulse API Running");
});

app.use("/api/auth", authRoutes);

export default app;
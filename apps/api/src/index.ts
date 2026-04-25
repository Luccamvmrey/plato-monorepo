import cors from "cors";
import express from "express";
import * as dotenv from "dotenv";
import { globalErrorHandler } from "./shared/middleware/errorMiddleware";

dotenv.config();

// --- Route Imports ---
import exerciseRoutes from "./modules/exercise/exercise.routes";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import workoutRoutes from "./modules/workout/workout.routes";
import workoutSessionRoutes from "./modules/workout-session/workout-session.routes";
import personalRecordRoutes from "./modules/workout-session/personal-record.routes";

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- API Routing ---
app.use("/api/exercises", exerciseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/sessions", workoutSessionRoutes);
app.use("/api/personal-records", personalRecordRoutes);

// --- Health Check ---
app.get("/health", (_req, res) => res.json({ status: "OK" }));

// --- Error Middleware ---
app.use(globalErrorHandler);

// --- Listener ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
import cors from "cors";
import express, { Request, Response } from "express";
import * as dotenv from "dotenv";
import { globalErrorHandler } from "./shared/middleware/errorMiddleware";

dotenv.config();

// --- Route Imports ---
import exerciseRoutes from "./modules/exercise/exercise.routes";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import workoutRoutes from "./modules/workout/workout.routes";
import programRoutes from "./modules/program/program.routes";
import workoutSessionRoutes from "./modules/workout-session/workout-session.routes";
import personalRecordRoutes from "./modules/workout-session/personal-record.routes";
import shareRoutes from "./modules/share/share.routes";
import * as shareController from "./modules/share/share.controller";
import { shareReadLimiter } from "./shared/middleware/rateLimitMiddleware";

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// A API roda atrás de um Nginx. Sem isto, todo mundo teria o IP do proxy e o limite de
// tentativas seria um contador único para o app inteiro.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// --- API Routing ---
app.use("/api/exercises", exerciseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/sessions", workoutSessionRoutes);
app.use("/api/personal-records", personalRecordRoutes);
app.use("/api/shares", shareRoutes);

// Fora de /api porque devolve HTML: o Nginx aponta `/s/` para cá. Ver `share.controller`.
app.get("/share-page/:token", shareReadLimiter, shareController.getPage);

// --- Health Check ---
// `/health` fica fora do prefixo /api e por isso pode não passar pelo reverse proxy;
// o alias abaixo garante um health check alcançável de fora.
const health = (_req: Request, res: Response) => res.json({ status: "OK" });

app.get("/health", health);
app.get("/api/health", health);

// --- API Index ---
// Sem esta rota, GET /api caía no finalhandler do Express e devolvia HTML.
app.get("/api", (_req, res) => res.json({
    name: "Plato API",
    version: process.env.npm_package_version ?? "1.0.0",
    resources: [
        "/api/auth",
        "/api/users",
        "/api/exercises",
        "/api/workouts",
        "/api/programs",
        "/api/sessions",
        "/api/personal-records",
        "/api/shares",
    ],
    docs: "docs/plato-api.postman_collection.json",
}));

// --- 404 ---
// Precisa vir depois de todas as rotas e antes do error handler. O globalErrorHandler
// tem 4 argumentos, então o Express nunca o chamaria para rota não encontrada.
app.use((req, res) => res.status(404).json({
    status: "fail",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
}));

// --- Error Middleware ---
app.use(globalErrorHandler);

// --- Listener ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
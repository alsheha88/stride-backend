import express from "express";
import "dotenv/config";
import authRouter from "./src/routes/auth.routes.js";
import dashboardRouter from "./src/routes/dashboard.routes.js";
import conceptsRouter from "./src/routes/concepts.routes.js";
import projectsRouter from "./src/routes/projects.routes.js";
import cookieParser from "cookie-parser";
import { ErrorHandler } from "./src/middleware/errorHandlingMiddleware.js";
import { setupEmail } from "./src/lib/email.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
app.use(express.json());
app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/concepts", conceptsRouter);
app.use("/projects", projectsRouter);

app.use(ErrorHandler);

try {
  await setupEmail();
  console.log("✓ Email ready");
} catch (err) {
  console.error("⚠ Email setup failed, continuing without email:", err);
}

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
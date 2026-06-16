import "./instrument.js";
import "./src/lib/env.js";
import express from "express";
import authRouter from "./src/routes/auth.routes.js";
import dashboardRouter from "./src/routes/dashboard.routes.js";
import conceptsRouter from "./src/routes/concepts.routes.js";
import projectsRouter from "./src/routes/projects.routes.js";
import cookieParser from "cookie-parser";
import { ErrorHandler } from "./src/middleware/errorHandlingMiddleware.js";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import {pinoHttp} from 'pino-http'
import { logger } from "./src/lib/logger.js";
import { env } from "./src/lib/env.js";
import { setupEmail } from "./src/lib/email.js";

const app = express();
const PORT = env.PORT;

app.set("trust proxy", 1);
app.use(pinoHttp({logger}))
app.use(express.json());
app.use(helmet());
app.use(
	cors({
		origin: env.APP_URL,
		credentials: true,
	}),
);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/dashboard", dashboardRouter);
app.use("/concepts", conceptsRouter);
app.use("/projects", projectsRouter);

Sentry.setupExpressErrorHandler(app);

app.use(ErrorHandler);

try {
  await setupEmail();
  logger.info("Email ready");
} catch (err) {
  logger.error({ err }, "Email setup failed");
}

app.listen(PORT, () => {
  logger.info(`Server is running on ${PORT}`);
});


import "dotenv/config";
import {env} from "./src/lib/env.js"
import * as Sentry from "@sentry/node";

Sentry.init({
	dsn: env.SENTRY_DSN,
});

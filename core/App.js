import express from "express";
import cors from "cors";
import plugins from "./PluginRegistry.js";
import { auditLogger } from "../middleware/auditLogger.js";
import { UPLOADS_ROOT } from "../config/paths.js";

// Side-effect import: registers the eventBus listeners that turn booking
// events (created/approved/rejected/checkedOut/overdue) into Notification
// documents. Must happen before the app starts accepting requests.
import "../modules/notifications/notifications.listeners.js";

const app = express();

// ✅ ADD THIS (CRITICAL)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));
// Configurable via CORS_ORIGINS (comma-separated) in .env — defaults cover
// the common Vite/TanStack Start dev ports (5173, 3000, 8080). Set this
// explicitly in production to your real client URL.
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000,http://localhost:8080")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(auditLogger);

// Locally-stored uploads (course materials, submissions, fuel receipts, etc.
// — see shared/middleware/upload.js and config/upload.js) are served back
// out from here instead of Cloudinary.
app.use("/uploads", express.static(UPLOADS_ROOT));

// routes
plugins.forEach((plugin) => {
  app.use(plugin.path, plugin.router);
});
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Campus RMS Backend Running"
  });
});
export default app;
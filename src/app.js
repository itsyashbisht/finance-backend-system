import "./env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ROUTES.
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import financialRecordRouter from "./routes/financialRecord.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/records", financialRecordRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use((err, req, res, next) => {
  // Keep `next` in the signature so Express treats this as an error middleware.
  void next;

  const statusCode = Number(err?.statusCode) || 500;
  const isProd = process.env.NODE_ENV === "production";

  // Avoid leaking internal error details in production.
  const message =
    isProd && statusCode === 500
      ? "Internal Server Error"
      : err?.message || "Internal Server Error";

  // Always log the full error server-side for debugging/observability.
  console.error(err);

  const payload = {
    statusCode,
    data: null,
    message,
    success: false,
    errors: Array.isArray(err?.errors) ? err.errors : [],
  };

  if (!isProd && err?.stack) payload.stack = err.stack;

  return res.status(statusCode).json(payload);
});

export { app };

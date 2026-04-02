import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { ApiResponse } from "./utils/apiResponse.js";

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
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, null, message));
});

export { app };

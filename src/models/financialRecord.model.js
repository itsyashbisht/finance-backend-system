import mongoose from "mongoose";
import { RECORD_CATEGORIES, RECORD_TYPES } from "../constant.js";

const financialRecordSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    type: {
      type: String,
      enum: Object.values(RECORD_TYPES),
      required: [true, "Type is required"],
    },
    category: {
      type: String,
      enum: Object.values(RECORD_CATEGORIES),
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const FinancialRecord = mongoose.model(
  "FinancialRecord",
  financialRecordSchema,
);

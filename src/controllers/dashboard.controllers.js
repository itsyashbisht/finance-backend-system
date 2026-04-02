import { FinancialRecord } from "../models/financialRecord.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// SUMMARY.
const getSummary = asyncHandler(async (req, res) => {
  const result = await FinancialRecord.aggregate([
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  // Shape the result into a clean response
  const summary = { totalIncome: 0, totalExpense: 0, totalRecords: 0 };

  result.forEach(({ _id, total, count }) => {
    if (_id === "INCOME") {
      summary.totalIncome = total;
    } else if (_id === "EXPENSE") {
      summary.totalExpense = total;
    }
    summary.totalRecords += count;
  });

  summary.netBalance = summary.totalIncome - summary.totalExpense;

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Summary fetched successfully"));
});

// BY CATEGORY.
const getByCategory = asyncHandler(async (req, res) => {
  const { type } = req.query; // optional -- filter by INCOME or EXPENSE

  const matchStage = {};
  if (type) matchStage.type = type;

  const result = await FinancialRecord.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        totalAmount: 1,
        count: 1,
      },
    },
    { $sort: { totalAmount: -1 } }, // highest first
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Category breakdown fetched successfully"),
    );
});

// MONTHLY TREND.
const getMonthlyTrend = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();

  const result = await FinancialRecord.aggregate([
    {
      // Only records from the requested year
      $match: {
        date: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    },
    {
      // Reshape -- one document per month with income + expense
      $group: {
        _id: "$_id.month",
        income: {
          $sum: {
            $cond: [{ $eq: ["$_id.type", "INCOME"] }, "$total", 0],
          },
        },
        expense: {
          $sum: {
            $cond: [{ $eq: ["$_id.type", "EXPENSE"] }, "$total", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        income: 1,
        expense: 1,
        net: { $subtract: ["$income", "$expense"] },
      },
    },
    { $sort: { month: 1 } }, // Jan -> Dec
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { year, trend: result },
        "Monthly trend fetched successfully",
      ),
    );
});

// RECENT ACTIVITIES.
const getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const records = await FinancialRecord.find()
    .populate("createdBy", "fullname email")
    .sort({ createdAt: -1 })
    .limit(limit);

  return res
    .status(200)
    .json(
      new ApiResponse(200, records, "Recent activity fetched successfully"),
    );
});

export { getSummary, getByCategory, getMonthlyTrend, getRecentActivity };

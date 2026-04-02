import { FinancialRecord } from "../models/financialRecord.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RECORD_CATEGORIES, RECORD_TYPES, ROLES } from "../constant.js";

// CREATE RECORD
const createRecord = asyncHandler(async (req, res) => {
  const { title, amount, type, category, date, description } = req.body;

  if (!title || !amount || !type || !category || !date)
    throw new ApiError(
      400,
      "title, amount, type, category and date are required",
    );

  if (!Object.values(RECORD_TYPES).includes(type))
    throw new ApiError(
      400,
      `Invalid type. Valid values: ${Object.values(RECORD_TYPES).join(", ")}`,
    );

  if (!Object.values(RECORD_CATEGORIES).includes(category))
    throw new ApiError(
      400,
      `Invalid category. Valid values: ${Object.values(RECORD_CATEGORIES).join(", ")}`,
    );

  if (amount <= 0) throw new ApiError(400, "Amount must be greater than 0");

  const record = await FinancialRecord.create({
    title,
    amount,
    type,
    category,
    date,
    description,
    createdBy: req.user._id, // always from token -- never from body
  });

  return res
    .status(201)
    .json(new ApiResponse(201, record, "Record created successfully"));
});

// GET ALL RECORDS (scoped by role)
const getAllRecords = asyncHandler(async (req, res) => {
  const {
    type,
    category,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = "date",
    sortType = "desc",
  } = req.query;

  // CORE RBAC DATA SCOPING -- employee sees only their own
  const filter = {};
  if (req.user.role === ROLES.EMPLOYEE) filter.createdBy = req.user._id;

  // Optional filters
  if (type) {
    if (!Object.values(RECORD_TYPES).includes(type))
      throw new ApiError(
        400,
        `Invalid type. Valid values: ${Object.values(RECORD_TYPES).join(", ")}`,
      );
    filter.type = type;
  }

  if (category) {
    if (!Object.values(RECORD_CATEGORIES).includes(category))
      throw new ApiError(
        400,
        `Invalid category. Valid values: ${Object.values(RECORD_CATEGORIES).join(", ")}`,
      );
    filter.category = category;
  }

  // Date range filter
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = sortType === "asc" ? 1 : -1;

  const [records, total] = await Promise.all([
    FinancialRecord.find(filter)
      .populate("createdBy", "fullname email role")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit)),
    FinancialRecord.countDocuments(filter),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { records, total, page: parseInt(page), limit: parseInt(limit) },
        "Records fetched successfully",
      ),
    );
});

// GET SINGLE RECORD.
const getRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await FinancialRecord.findById(id).populate(
    "createdBy",
    "fullname email role",
  );
  if (!record) throw new ApiError(404, "Record not found");

  // Employee can only view their own record
  if (
    req.user.role === ROLES.EMPLOYEE &&
    record.createdBy._id.toString() !== req.user._id.toString()
  )
    throw new ApiError(403, "You do not have permission to view this record");

  return res
    .status(200)
    .json(new ApiResponse(200, record, "Record fetched successfully"));
});

// UPDATE RECORD.
const updateRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, amount, type, category, date, description } = req.body;

  if (!title && !amount && !type && !category && !date && !description)
    throw new ApiError(400, "At least one field is required to update");

  const record = await FinancialRecord.findById(id);
  if (!record) throw new ApiError(404, "Record not found");

  // Employee can only update their own record
  if (
    req.user.role === ROLES.EMPLOYEE &&
    record.createdBy.toString() !== req.user._id.toString()
  )
    throw new ApiError(403, "You do not have permission to update this record");

  // Validate type and category if provided
  if (type && !Object.values(RECORD_TYPES).includes(type))
    throw new ApiError(
      400,
      `Invalid type. Valid values: ${Object.values(RECORD_TYPES).join(", ")}`,
    );

  if (category && !Object.values(RECORD_CATEGORIES).includes(category))
    throw new ApiError(
      400,
      `Invalid category. Valid values: ${Object.values(RECORD_CATEGORIES).join(", ")}`,
    );

  if (amount !== undefined && amount <= 0)
    throw new ApiError(400, "Amount must be greater than 0");

  // Build update object dynamically
  const updateFields = {};
  if (title) updateFields.title = title;
  if (amount) updateFields.amount = amount;
  if (type) updateFields.type = type;
  if (category) updateFields.category = category;
  if (date) updateFields.date = date;
  if (description !== undefined) updateFields.description = description;

  const updatedRecord = await FinancialRecord.findByIdAndUpdate(
    id,
    { $set: updateFields },
    { new: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedRecord, "Record updated successfully"));
});

// DELETE RECORD (ADMIN + MANAGER only)
const deleteRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await FinancialRecord.findByIdAndDelete(id);
  if (!record) throw new ApiError(404, "Record not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Record deleted successfully"));
});

export {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};

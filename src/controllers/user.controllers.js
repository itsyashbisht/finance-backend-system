import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES } from "../constant.js";

// GET MY PROFILE.
const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by verifyJWT -- no DB call needed
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Profile fetched successfully"));
});

// UPDATE MY PROFILE.
const updateMe = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname && !email)
    throw new ApiError(400, "At least one field is required to update");

  // Build update object dynamically -- only update what was sent
  const updateFields = {};
  if (fullname) updateFields.fullname = fullname;
  if (email) updateFields.email = email.toLowerCase();

  // Check if new email is already taken by someone else
  if (email) {
    const emailExists = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    if (emailExists) throw new ApiError(409, "Email is already in use");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true },
  ).select("-password -refreshToken");

  if (!updatedUser)
    throw new ApiError(500, "Something went wrong while updating profile");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

// GET ALL USERS (ADMIN).
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (role) {
    if (!Object.values(ROLES).includes(role))
      throw new ApiError(
        400,
        `Invalid role. Valid roles: ${Object.values(ROLES).join(", ")}`,
      );
    filter.role = role;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password -refreshToken")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { users, total, page: parseInt(page), limit: parseInt(limit) },
        "Users fetched successfully",
      ),
    );
});

// UPDATE USER ROLE (ADMIN).
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) throw new ApiError(400, "Role is required");

  if (!Object.values(ROLES).includes(role))
    throw new ApiError(
      400,
      `Invalid role. Valid roles: ${Object.values(ROLES).join(", ")}`,
    );

  // Prevent admin from changing their own role
  if (id === req.user._id.toString())
    throw new ApiError(400, "You cannot change your own role");

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true },
  ).select("-password -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User role updated successfully"));
});

// DELETE USER (ADMIN).
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (id === req.user._id.toString())
    throw new ApiError(400, "You cannot delete your own account");

  const user = await User.findByIdAndDelete(id);
  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

// TOGGLE USER STATUS (ADMIN).
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === req.user._id.toString())
    throw new ApiError(400, "You cannot change your own status");

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isActive: user.isActive },
        `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      ),
    );
});

export {
  getMe,
  updateMe,
  getAllUsers,
  updateUserRole,
  deleteUser,
  toggleUserStatus,
};

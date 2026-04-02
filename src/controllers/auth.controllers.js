import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTokens } from "../utils/generateToken.js";

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

// REGISTER.
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, role } = req.body;

  if (!fullname || !email || !password)
    throw new ApiError(400, "All fields are required");

  const existingUser = await User.findOne({ email });
  if (existingUser)
    throw new ApiError(409, "User with this email already exists");

  const user = await User.create({ fullname, email, password, role });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering user");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// LOGIN.
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "Login successful",
      ),
    );
});

// LOGOUT.
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// REFRESH TOKEN.
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decodedToken._id);
  if (!user) throw new ApiError(401, "Invalid refresh token");

  if (incomingRefreshToken !== user.refreshToken)
    throw new ApiError(401, "Refresh token has expired or already used");

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    user._id,
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken },
        "Access token refreshed successfully",
      ),
    );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };

import { ApiError } from "../utils/apiError.js";

const authorize = (...allowedRoles) => {
  return (req, _, next) => {
    if (!req.user) throw new ApiError(401, "Unauthorized request");

    if (!allowedRoles.includes(req.user.role))
      throw new ApiError(
        403,
        "You do not have permission to perform this action",
      );

    next();
  };
};

export { authorize };

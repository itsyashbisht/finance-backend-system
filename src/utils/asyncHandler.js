// Handler function returns a function with (req,res,next) as params.

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error),
    );
  };
};

export { asyncHandler };

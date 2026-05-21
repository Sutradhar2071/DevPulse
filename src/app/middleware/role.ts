import type { NextFunction, Response } from "express";
import type { CustomRequest } from "./auth";
import { StatusCodes } from "http-status-codes";

const authorizeRole = (...roles: string[]) => {
  return (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Forbidden access",
      });
    }

    next();
  };
};

export default authorizeRole;
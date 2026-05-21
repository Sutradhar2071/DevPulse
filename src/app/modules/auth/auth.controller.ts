import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  signupUser,
  loginUser,
} from "./auth.service";

export const signup = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await signupUser(req.body);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await loginUser(req.body);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: error.message,
    });
  }
};
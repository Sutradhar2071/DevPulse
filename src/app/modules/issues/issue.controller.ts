import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  createIssueIntoDB,
  deleteIssueFromDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
} from "./issue.service";
import type { CustomRequest } from "../../middleware/auth";

export const createIssue = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const reporter_id = req.user.id;

    const result = await createIssueIntoDB(
      req.body,
      reporter_id
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllIssues = async (
  req: Request,
  res: Response
) => {
  try {
    const { sort, type, status } = req.query;

    const result = await getAllIssuesFromDB(
      sort as string,
      type as string,
      status as string
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleIssue = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getSingleIssueFromDB(
      Number(req.params.id)
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateIssue = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const result = await updateIssueIntoDB(
      Number(req.params.id),
      req.body,
      req.user
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteIssue = async (
  req: Response | any,
  res: Response
) => {
  try {
    await deleteIssueFromDB(
      Number(req.params.id)
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: error.message,
    });
  }
};
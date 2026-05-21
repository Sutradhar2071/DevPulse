import express from "express";

import auth from "../../middleware/auth";
import authorizeRole from "../../middleware/role";

import {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
} from "./issue.controller";

const router = express.Router();

router.post("/", auth, createIssue);

router.get("/", getAllIssues);

router.get("/:id", getSingleIssue);

router.patch(
  "/:id",
  auth,
  updateIssue
);

router.delete(
  "/:id",
  auth,
  authorizeRole("maintainer"),
  deleteIssue
);

export default router;
import { pool } from "../../config/db";

interface CreateIssuePayload {
  title: string;
  description: string;
  type: string;
}

export const createIssueIntoDB = async (
  payload: CreateIssuePayload,
  reporter_id: number
) => {
  const { title, description, type } = payload;

  const result = await pool.query(
    `
    INSERT INTO issues(title, description, type, reporter_id)
    VALUES($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );

  return result.rows[0];
};

export const getAllIssuesFromDB = async (
  sort?: string,
  type?: string,
  status?: string
) => {
  let query = `SELECT * FROM issues`;

  const conditions: string[] = [];
  const values: string[] = [];

  // filter type
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  // filter status
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  // add where
  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  // sorting
  if (sort === "oldest") {
    query += ` ORDER BY created_at ASC`;
  } else {
    query += ` ORDER BY created_at DESC`;
  }

  const issuesResult = await pool.query(query, values);

  const issues = issuesResult.rows;

  // extract reporter ids
  const reporterIds = [
    ...new Set(
      issues.map((issue) => issue.reporter_id)
    ),
  ];

  // fetch users separately
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );

  const users = usersResult.rows;

  // attach reporter manually
  const formattedIssues = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: users.find(
      (user) => user.id === issue.reporter_id
    ),
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return formattedIssues;
};

export const getSingleIssueFromDB = async (
  id: number
) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id]
  );

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  // fetch reporter separately
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id]
  );

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

export const updateIssueIntoDB = async (
  id: number,
  payload: any,
  user: any
) => {
  // find issue
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id]
  );

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  // contributor permission check
  if (user.role === "contributor") {
    // own issue only
    if (issue.reporter_id !== user.id) {
      throw new Error(
        "You can only update your own issues"
      );
    }

    // only open issue
    if (issue.status !== "open") {
      throw new Error(
        "You cannot update resolved or in progress issues"
      );
    }
  }

  const {
    title,
    description,
    type,
    status,
  } = payload;

  const updatedResult = await pool.query(
    `
    UPDATE issues
    SET
      title = $1,
      description = $2,
      type = $3,
      status = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
    `,
    [
      title || issue.title,
      description || issue.description,
      type || issue.type,
      status || issue.status,
      id,
    ]
  );

  return updatedResult.rows[0];
};

export const deleteIssueFromDB = async (
  id: number
) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id]
  );

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  await pool.query(
    `
    DELETE FROM issues WHERE id = $1
    `,
    [id]
  );
};
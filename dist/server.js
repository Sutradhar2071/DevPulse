

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app/app.ts
import express3 from "express";
import cors from "cors";

// src/app/modules/auth/auth.route.ts
import express from "express";

// src/app/modules/auth/auth.controller.ts
import { StatusCodes } from "http-status-codes";

// src/app/modules/auth/auth.service.ts
import bcrypt from "bcrypt";

// src/app/config/db.ts
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// src/app/utils/jwt.ts
import jwt from "jsonwebtoken";
var createToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

// src/app/modules/auth/auth.service.ts
var signupUser = async (payload) => {
  const { name, email, password, role } = payload;
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (existingUser.rows.length > 0) {
    throw new Error("User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role)
    VALUES($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  const userResult = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (userResult.rows.length === 0) {
    throw new Error("Invalid email or password");
  }
  const user = userResult.rows[0];
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );
  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }
  const token = createToken({
    id: user.id,
    name: user.name,
    role: user.role
  });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};

// src/app/modules/auth/auth.controller.ts
var signup = async (req, res) => {
  try {
    const result = await signupUser(req.body);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};
var login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: error.message
    });
  }
};

// src/app/modules/auth/auth.route.ts
var router = express.Router();
router.post("/signup", signup);
router.post("/login", login);
var auth_route_default = router;

// src/app/modules/issues/issue.route.ts
import express2 from "express";

// src/app/middleware/auth.ts
import jwt2 from "jsonwebtoken";
import { StatusCodes as StatusCodes2 } from "http-status-codes";
var auth = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(StatusCodes2.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    const decoded = jwt2.verify(
      token,
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(StatusCodes2.UNAUTHORIZED).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};
var auth_default = auth;

// src/app/middleware/role.ts
import { StatusCodes as StatusCodes3 } from "http-status-codes";
var authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes3.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized access"
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes3.FORBIDDEN).json({
        success: false,
        message: "Forbidden access"
      });
    }
    next();
  };
};
var role_default = authorizeRole;

// src/app/modules/issues/issue.controller.ts
import { StatusCodes as StatusCodes4 } from "http-status-codes";

// src/app/modules/issues/issue.service.ts
var createIssueIntoDB = async (payload, reporter_id) => {
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
var getAllIssuesFromDB = async (sort, type, status) => {
  let query = `SELECT * FROM issues`;
  const conditions = [];
  const values = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }
  if (sort === "oldest") {
    query += ` ORDER BY created_at ASC`;
  } else {
    query += ` ORDER BY created_at DESC`;
  }
  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;
  const reporterIds = [
    ...new Set(
      issues.map((issue) => issue.reporter_id)
    )
  ];
  const usersResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const users = usersResult.rows;
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
    updated_at: issue.updated_at
  }));
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
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
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (id, payload, user) => {
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
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error(
        "You can only update your own issues"
      );
    }
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
    status
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
      id
    ]
  );
  return updatedResult.rows[0];
};
var deleteIssueFromDB = async (id) => {
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

// src/app/modules/issues/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const reporter_id = req.user.id;
    const result = await createIssueIntoDB(
      req.body,
      reporter_id
    );
    res.status(StatusCodes4.CREATED).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    res.status(StatusCodes4.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await getAllIssuesFromDB(
      sort,
      type,
      status
    );
    res.status(StatusCodes4.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(StatusCodes4.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const result = await getSingleIssueFromDB(
      Number(req.params.id)
    );
    res.status(StatusCodes4.OK).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(StatusCodes4.NOT_FOUND).json({
      success: false,
      message: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const result = await updateIssueIntoDB(
      Number(req.params.id),
      req.body,
      req.user
    );
    res.status(StatusCodes4.OK).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    res.status(StatusCodes4.BAD_REQUEST).json({
      success: false,
      message: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    await deleteIssueFromDB(
      Number(req.params.id)
    );
    res.status(StatusCodes4.OK).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    res.status(StatusCodes4.NOT_FOUND).json({
      success: false,
      message: error.message
    });
  }
};

// src/app/modules/issues/issue.route.ts
var router2 = express2.Router();
router2.post("/", auth_default, createIssue);
router2.get("/", getAllIssues);
router2.get("/:id", getSingleIssue);
router2.patch(
  "/:id",
  auth_default,
  updateIssue
);
router2.delete(
  "/:id",
  auth_default,
  role_default("maintainer"),
  deleteIssue
);
var issue_route_default = router2;

// src/app/app.ts
var app = express3();
app.use(cors());
app.use(express3.json());
app.get("/", (req, res) => {
  res.send("DevPulse API Running");
});
app.use("/api/auth", auth_route_default);
app.use("/api/issues", issue_route_default);
var app_default = app;

// src/server.ts
var PORT = 5e3;
app_default.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map
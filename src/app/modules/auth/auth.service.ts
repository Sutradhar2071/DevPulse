import bcrypt from "bcrypt";
import { pool } from "../../config/db";
import { createToken } from "../../utils/jwt";

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const signupUser = async (payload: SignupPayload) => {
  const { name, email, password, role } = payload;

  // check existing user
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error("User already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // insert user
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

interface LoginPayload {
  email: string;
  password: string;
}

export const loginUser = async (payload: LoginPayload) => {
  const { email, password } = payload;

  const userResult = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = userResult.rows[0];

  // compare password
  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid email or password");
  }

  // create jwt token
  const token = createToken({
    id: user.id,
    name: user.name,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};
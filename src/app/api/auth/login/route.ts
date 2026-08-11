import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return Response.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  // Step 1: User dhoondo
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const user = result.rows[0];

  if (!user) {
    return Response.json(
      { message: "Invalid email or password." },
      { status: 401 }
    );
  }

  // Step 2: Password compare karo
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return Response.json(
      { message: "Invalid email or password." },
      { status: 401 }
    );
  }

  // Step 3: JWT token banao
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );

  return Response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
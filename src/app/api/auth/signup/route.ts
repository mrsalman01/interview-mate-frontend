import bcrypt from "bcrypt";
import pool from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password } = body;

  // Step 1: Validation - basic checks
  if (!name || !email || !password) {
    return Response.json(
      { message: "Name, email, and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return Response.json(
      { message: "Password must be at least 6 characters." },
      { status: 400 }
    );
  }

  // Step 2: Check karo email pehle se exist to nahi karta
  const existingUser = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (existingUser.rows.length > 0) {
    return Response.json(
      { message: "Email already registered." },
      { status: 409 }
    );
  }

  // Step 3: Password hash karo
  const hashedPassword = await bcrypt.hash(password, 10);

  // Step 4: Naya user database mein daalo
  const result = await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
    [name, email, hashedPassword]
  );

  const newUser = result.rows[0];

  return Response.json(newUser, { status: 201 });
}
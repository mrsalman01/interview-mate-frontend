import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Confirm karo session isi user ka hai
  const session = await pool.query(
    "SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2",
    [id, user.userId]
  );

  if (session.rows.length === 0) {
    return Response.json({ message: "Session not found." }, { status: 404 });
  }

  const answers = await pool.query(
    "SELECT question, answer FROM interview_answers WHERE session_id = $1 ORDER BY created_at ASC",
    [id]
  );

  return Response.json(answers.rows);
}
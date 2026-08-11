import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = verifyToken(request);

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check karo ye session isi user ka hai
  const session = await pool.query(
    "SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2",
    [id, user.userId]
  );

  if (session.rows.length === 0) {
    return Response.json({ message: "Session not found." }, { status: 404 });
  }

  // Delete karo (cascade se answers khud delete ho jayenge)
  await pool.query("DELETE FROM interview_sessions WHERE id = $1", [id]);

  return Response.json({ message: "Session deleted successfully." });
}
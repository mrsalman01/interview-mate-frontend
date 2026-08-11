import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  const user = verifyToken(request);

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { jobRole } = body;

  if (!jobRole) {
    return Response.json({ message: "Job role is required." }, { status: 400 });
  }

  const result = await pool.query(
    "INSERT INTO interview_sessions (user_id, job_role) VALUES ($1, $2) RETURNING id, job_role, created_at",
    [user.userId, jobRole],
  );

  const newSession = result.rows[0];

  // Naya: User ka resume nikalo
  const userResult = await pool.query(
    "SELECT resume_text FROM users WHERE id = $1",
    [user.userId],
  );
  const resumeText = userResult.rows[0]?.resume_text || null;

  // Naya: ADK session banao, resume + job_role ke saath state mein
  const adkUserId = `user_${user.userId}`;
  const ADK_URL = process.env.ADK_URL || "http://localhost:8000";

  await fetch(
    `${ADK_URL}/apps/interview_agent/users/${adkUserId}/sessions/${newSession.id}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_role: jobRole,
        resume_text: resumeText,
      }),
    },
  );
  console.log("Creating ADK session with state:", {
  job_role: jobRole,
  resume_length: resumeText?.length ?? 0,
  has_resume: Boolean(resumeText),
});

  return Response.json(newSession, { status: 201 });
}

export async function GET(request: Request) {
  const user = verifyToken(request);

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT id, job_role, created_at FROM interview_sessions WHERE user_id = $1 ORDER BY created_at DESC",
    [user.userId],
  );

  return Response.json(result.rows);
}

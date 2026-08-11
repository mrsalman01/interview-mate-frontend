import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { getSessionState } from "@/lib/adk";

const ADK_URL = process.env.ADK_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const user = verifyToken(request);

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, message } = body;

  const adkUserId = `user_${user.userId}`;

  // Step 1: ADK session ensure karo
  await fetch(
    `${ADK_URL}/apps/interview_agent/users/${adkUserId}/sessions/${sessionId}`,
    { method: "POST" }
  );

  // Step 2: Message bhejo agent ko
  const response = await fetch(`${ADK_URL}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_name: "interview_agent",
      user_id: adkUserId,
      session_id: sessionId,
      new_message: {
        role: "user",
        parts: [{ text: message }],
      },
    }),
  });

  const data = await response.json();
  const lastEvent = data[data.length - 1];
  const replyText = lastEvent.content.parts[0].text;

  // Step 3: Naye answers ko Postgres mein sync karo
  await syncAnswersToDatabase(sessionId, adkUserId);

  return Response.json({ reply: replyText });
}

async function syncAnswersToDatabase(dbSessionId: string, adkUserId: string) {
  // ADK se poora current state nikalo
  const state = await getSessionState(adkUserId, dbSessionId);
  const history = state.interview_history || [];

  // Postgres mein kitne answers already save hain, count karo
  const existingCount = await pool.query(
    "SELECT COUNT(*) FROM interview_answers WHERE session_id = $1",
    [dbSessionId]
  );
  const savedCount = parseInt(existingCount.rows[0].count);

  // Agar ADK ki history lambi hai, naye answers insert karo
  if (history.length > savedCount) {
    const newAnswers = history.slice(savedCount);

    for (const entry of newAnswers) {
      await pool.query(
        "INSERT INTO interview_answers (session_id, question, answer) VALUES ($1, $2, $3)",
        [dbSessionId, entry.question, entry.answer]
      );
    }
  }
}
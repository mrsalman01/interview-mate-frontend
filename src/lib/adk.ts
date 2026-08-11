const ADK_URL = (
  process.env.ADK_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export async function getSessionState(userId: string, sessionId: string) {
  const response = await fetch(
    `${ADK_URL}/apps/interview_agent/users/${userId}/sessions/${sessionId}`
  );
  const data = await response.json();
  return data.state || {};
}
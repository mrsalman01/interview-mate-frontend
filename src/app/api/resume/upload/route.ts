import pool from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { extractText, getDocumentProxy } from "unpdf";

export async function POST(request: Request) {
  const user = verifyToken(request);

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("resume") as File;

  if (!file) {
    return Response.json({ message: "No file uploaded." }, { status: 400 });
  }

  // File ko binary data mein convert karo
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // PDF ko load karo, phir text nikalo
  const pdf = await getDocumentProxy(uint8Array);
  const { text } = await extractText(pdf, { mergePages: true });

  // Database mein save karo
  await pool.query("UPDATE users SET resume_text = $1 WHERE id = $2", [
    text,
    user.userId,
  ]);

  return Response.json({ message: "Resume uploaded successfully." });
}
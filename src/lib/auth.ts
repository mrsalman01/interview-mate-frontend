import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  email: string;
}

export function verifyToken(request: Request): JwtPayload | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  provider: "Keycloak" | "Google"; 
  name?: string;
  picture?: string;
  groups?: string[];
  iat?: number;
  exp?: number;
}

export async function GET(request: NextRequest) {
  console.log("🔄 [ME] /api/auth/me called");

  const token = request.cookies.get("auth_token")?.value;
  if (!token) {
    console.error("❌ [ME] No auth_token cookie found");
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    console.log("✅ [ME] Token verified successfully");
    console.log("🔍 [ME] Verified payload:", payload);

    const user = {
      id: payload.userId,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      role: payload.role || "user",
      provider: payload.provider, // ✅ maintenant reconnu
      picture: payload.picture,
      groups: payload.groups || [],
    };

    console.log("✅ [ME] User constructed:", user);

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err: any) {
    console.error("💥 [ME] Token verification failed:", err.message || err);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

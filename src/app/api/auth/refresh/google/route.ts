import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🔄 [GoogleRefresh] Endpoint triggered");

  const refreshToken = request.cookies.get("google_refresh_token")?.value;
  if (!refreshToken) {
    console.error("⚠️ [GoogleRefresh] No refresh token");
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      console.error("❌ [GoogleRefresh] Failed:", await res.text());
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    }

    const data = await res.json();
    console.log("✅ [GoogleRefresh] New tokens received:", data);

    const response = NextResponse.json({ success: true });
    if (data.access_token) {
      response.cookies.set("google_access_token", data.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    if (data.id_token) {
      response.cookies.set("auth_token", data.id_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }
    return response;
  } catch (err) {
    console.error("💥 [GoogleRefresh] Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

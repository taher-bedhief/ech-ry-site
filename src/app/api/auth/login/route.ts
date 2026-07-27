import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  console.log("🔍 [Login] Endpoint triggered (Keycloak)");

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // 🔹 Appel direct à Keycloak pour obtenir un token
    const res = await fetch(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: "password",
          username: email,
          password,
        }),
      }
    );

    if (!res.ok) {
      console.error("❌ [Login] Keycloak login failed:", await res.text());
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    const data = await res.json();
    const { access_token, refresh_token, id_token } = data;

    if (!access_token) {
      return NextResponse.json({ error: "No access token returned" }, { status: 401 });
    }

    console.log("✅ [Login] Keycloak tokens received");

    // 🔹 Décoder le token JWT
    const payload = JSON.parse(
      Buffer.from(access_token.split(".")[1], "base64").toString()
    );

    console.log("📌 [Login] Payload reçu:", payload);

    const roles: string[] = payload.realm_access?.roles || [];
    const role = roles.includes("admin") ? "admin" : "user";
    const groups: string[] = payload.groups || [];

    // 🔹 Générer un JWT interne (optionnel)
    const internalToken = jwt.sign(
      {
        userId: payload.sub,
        email: payload.email,
        role,
        provider: "Keycloak",
        name: payload.name || payload.preferred_username || payload.email,
        groups,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log("✅ [Login] Internal token generated");

    const isProd = request.url.includes("ech-ry.com");
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("none" as const) : ("lax" as const),
      path: "/",
      domain: isProd ? ".ech-ry.com" : undefined,
    };

    const responseOut = NextResponse.json({
      success: true,
      user: {
        email: payload.email,
        name: payload.name || payload.preferred_username || payload.email,
        role,
        provider: "Keycloak",
        groups,
      },
    });

    // 🍪 Poser les cookies
    responseOut.cookies.set("auth_token", internalToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    if (refresh_token) {
      responseOut.cookies.set("refreshToken", refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    }
    responseOut.cookies.set("accessToken", access_token, { ...cookieOptions, maxAge: 60 * 60 * 24 });

    console.log("✅ [Login] Cookies set successfully");
    return responseOut;
  } catch (err: any) {
    console.error("💥 [Login] Failed:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}

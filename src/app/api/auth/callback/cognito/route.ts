import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  console.log("🔍 [CognitoCallback] Endpoint triggered:", request.url);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  console.log("➡️ [CognitoCallback] Query params:", { code, state });

  if (!code) {
    console.error("❌ [CognitoCallback] No code received");
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  try {
    // 🔹 Échange du code contre des tokens
    const tokenUrl = `${process.env.COGNITO_DOMAIN}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.COGNITO_APP_CLIENT_ID!,
      redirect_uri: process.env.COGNITO_REDIRECT_URI!,
      code,
    });

    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("💥 [CognitoCallback] Token exchange failed:", errorText);
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
    }

    const tokens = await res.json();
    console.log("✅ [CognitoCallback] Tokens received:", {
      hasIdToken: !!tokens.id_token,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });

    if (!tokens.id_token) {
      console.error("❌ [CognitoCallback] No id_token in response");
      return NextResponse.json({ error: "No id_token" }, { status: 401 });
    }

    // 🔹 Décodage du payload Cognito
    const payload = jwt.decode(tokens.id_token) as any;
    console.log("📌 [CognitoCallback] Payload reçu:", payload);

    const email = payload.email;
    const username = payload["cognito:username"];
    const groups: string[] = payload["cognito:groups"] || [];
    const role = groups.includes("admin") ? "admin" : "user";

    // 🔹 Fallback pour le nom
    const name =
      (payload.name && payload.name.trim()) ||
      (username && !username.match(/^[0-9a-f-]{36}$/) ? username : null) ||
      (email ? email.split("@")[0] : "User");

    // 🔹 Génération du JWT interne
    const internalToken = jwt.sign(
      {
        userId: email,
        email,
        role,
        provider: "Cognito",
        name,
        groups,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    console.log("✅ [CognitoCallback] Internal token generated");

    // 🔹 Détection environnement
    const isProd = request.url.includes("ech-ry.com");
    const defaultRedirect = isProd ? "https://www.ech-ry.com" : "/";
    const redirectTo = state || defaultRedirect;

    const finalUrl = new URL(redirectTo, request.url);
    finalUrl.searchParams.set("auth", "success");

    const response = NextResponse.redirect(finalUrl);
    console.log("➡️ [CognitoCallback] Redirecting to:", finalUrl.toString());

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? ("none" as const) : ("lax" as const),
      path: "/",
      domain: isProd ? ".ech-ry.com" : undefined,
    };

    // 🍪 Définir les cookies
    response.cookies.set("auth_token", internalToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    if (tokens.refresh_token) {
      response.cookies.set("refreshToken", tokens.refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    }

    console.log("✅ [CognitoCallback] Cookies set successfully");
    return response;
  } catch (err) {
    console.error("💥 [CognitoCallback] Failed:", err);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import jwtDecode from "jwt-decode";
import { generateToken } from "@/lib/auth/utils";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  console.log("🔍 [GoogleCallback] Endpoint triggered:", request.url);

  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    console.log("➡️ [GoogleCallback] Query params:", { code, state });

    if (!code) {
      console.warn("⚠️ [GoogleCallback] Missing code in query params");
      return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
    }

    const clientId = process.env.COGNITO_CLIENT_ID!;
    const redirectUri = process.env.COGNITO_REDIRECT_URI!;
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;

    console.log("📑 [GoogleCallback] OAuth config:", { clientId, redirectUri, domain });

    // 🔄 Échange du code contre des tokens Cognito
    const tokenRes = await fetch(`${domain}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("💥 [GoogleCallback] Token exchange failed:", errorText);
      return NextResponse.redirect(new URL("/login?error=token_failed", url.origin));
    }

    const tokens = await tokenRes.json();
    const { id_token, access_token, refresh_token } = tokens;

    console.log("✅ [GoogleCallback] Tokens received:", {
      hasIdToken: !!id_token,
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
    });

    if (!id_token || !access_token) {
      console.warn("⚠️ [GoogleCallback] Missing id_token or access_token");
      return NextResponse.redirect(new URL("/login?error=missing_tokens", url.origin));
    }

    // 🔓 Décoder l'id_token
    const decoded: any = jwtDecode(id_token);

    // 🔹 Enrichir avec Google userinfo
    try {
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (userInfoRes.ok) {
        const googleUser = await userInfoRes.json();
        decoded.email = googleUser.email || decoded.email;
        decoded.name = googleUser.name || decoded.name;
        decoded.picture = googleUser.picture || decoded.picture;
      }
    } catch (err) {
      console.error("💥 [GoogleCallback] Error fetching Google userinfo:", err);
    }

    const email = decoded.email || decoded.username || "google-user";
    const name = decoded.name || email;
    const picture = decoded.picture;

    // 🔹 Extraire groupes Cognito (si l’utilisateur est mappé dans Cognito)
    const groups: string[] = decoded["cognito:groups"] || [];
    const isAdmin = groups.includes("admin");

    // 🔐 Générer un JWT interne enrichi
    const appToken = await generateToken({
      userId: email,
      email,
      role: isAdmin ? "admin" : "user", // 👈 rôle basé sur le groupe
      provider: "Google",
      name,
      picture,
      groups, // 👈 stocker aussi la liste des groupes
    });

    // 🔹 Détection environnement
    const isProd = url.hostname.includes("ech-ry.com");
    const defaultRedirect = isProd ? "https://www.ech-ry.com" : "/";
    const redirectTo = state || defaultRedirect;

    // 🔹 Redirection finale avec paramètre auth=success
    const finalUrl = new URL(redirectTo, url.origin);
    finalUrl.searchParams.set("auth", "success");
    const response = NextResponse.redirect(finalUrl);
    console.log("➡️ [GoogleCallback] Redirecting to:", finalUrl.toString());

    const sameSite: ResponseCookie["sameSite"] = isProd ? "none" : "lax";

    const cookieOptions: Partial<ResponseCookie> = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: "/",
      domain: isProd ? ".ech-ry.com" : undefined,
    };

    // 🍪 Définir les cookies
    response.cookies.set("auth_token", appToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    response.cookies.set("accessToken", access_token, { ...cookieOptions, maxAge: 60 * 60 });
    if (refresh_token) {
      response.cookies.set("refreshToken", refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
    }

    console.log("✅ [GoogleCallback] Cookies set successfully");
    return response;
  } catch (err: any) {
    console.error("💥 [GoogleCallback] Server error:", err.message || err);
    return NextResponse.redirect(new URL("/login?error=server_error", request.url));
  }
}

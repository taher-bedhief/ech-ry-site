// src/lib/auth/handleOAuthCallback.ts
import { NextResponse } from "next/server";
import jwtDecode from "jwt-decode";
import { generateToken } from "./utils";

export async function handleOAuthCallback({
  id_token,
  access_token,
  refresh_token,
  provider,
  redirectTo,
  url,
}: {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  provider: "Google" | "Keycloak"; // ✅ correction : ajout Keycloak
  redirectTo: string;
  url: URL;
}) {
  const decoded: any = jwtDecode(id_token);

  if (provider === "Google") {
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
      console.error("⚠️ [OAuthCallback] Google userinfo fetch failed:", err);
    }
  }

  // 🔐 Générer JWT interne
  const appToken = await generateToken({
    userId: decoded.sub || decoded.email,
    email: decoded.email,
    role: "user",
    provider, // ✅ maintenant reconnu
    name: decoded.name || (decoded.email ? decoded.email.split("@")[0] : "User"),
    picture: decoded.picture,
  });

  const isProd = url.hostname.includes("ech-ry.com");
  const sameSite: "none" | "lax" = isProd ? "none" : "lax";
  const cookieOptions = { httpOnly: true, secure: isProd, sameSite, path: "/" };

  const response = NextResponse.redirect(new URL(redirectTo, url.origin));
  response.cookies.set("auth_token", appToken, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set("accessToken", access_token, { ...cookieOptions, maxAge: 60 * 60 });
  if (refresh_token) {
    response.cookies.set("refreshToken", refresh_token, { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 });
  }

  return response;
}

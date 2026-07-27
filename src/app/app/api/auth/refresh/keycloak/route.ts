import { NextRequest, NextResponse } from "next/server";
import jwtDecode from "jwt-decode";
import { generateToken } from "@/lib/auth/utils";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    console.log("🔄 [KeycloakRefresh] Endpoint triggered");

    // 🍪 Lire refresh token
    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      console.warn("⚠️ [KeycloakRefresh] No refresh token");
      return NextResponse.json(
        { success: false, error: "No refresh token" },
        { status: 401 }
      );
    }

    const clientId = process.env.KEYCLOAK_CLIENT_ID!;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!;
    const issuer = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;

    // 🔁 Refresh Keycloak tokens
    const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      console.error("❌ [KeycloakRefresh] Refresh failed:", await res.text());
      return NextResponse.json(
        { success: false, error: "Refresh failed" },
        { status: 401 }
      );
    }

    const tokens = await res.json();
    const { id_token, access_token, refresh_token: newRefreshToken } = tokens;

    if (!id_token || !access_token) {
      console.warn("⚠️ [KeycloakRefresh] Missing tokens");
      return NextResponse.json(
        { success: false, error: "Missing tokens" },
        { status: 401 }
      );
    }

    // 🔓 Décoder id_token Keycloak
    const decoded: any = jwtDecode(id_token);

    const email = decoded.email;
    const username = decoded.preferred_username;
    const groups: string[] = decoded.groups || [];
    const roles: string[] = decoded.realm_access?.roles || [];
    const role = roles.includes("admin") ? "admin" : "user";

    // 🔹 Fallback pour le nom
    const name =
      (decoded.name && decoded.name.trim()) ||
      username ||
      (email ? email.split("@")[0] : "User");

    // 🔐 Générer JWT interne
    const appToken = await generateToken({
      userId: decoded.sub,
      email,
      role,
      provider: "Keycloak",
      name,
      picture: decoded.picture,
      groups,
    });

    // ✅ Réponse JSON + cookies
    const response = NextResponse.json({ success: true, token: appToken });

    // 🌍 Environnement
    const host = req.nextUrl.hostname;
    const isProd = host.includes("ech-ry.com");

    const sameSite: ResponseCookie["sameSite"] = isProd ? "none" : "lax";

    const cookieOptions: Partial<ResponseCookie> = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: "/",
      domain: isProd ? ".ech-ry.com" : undefined,
    };

    // 🍪 Reposer cookies
    response.cookies.set("auth_token", appToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 jours
    });

    response.cookies.set("accessToken", access_token, {
      ...cookieOptions,
      maxAge: 60 * 60, // 1 heure
    });

    if (newRefreshToken) {
      response.cookies.set("refreshToken", newRefreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    console.log("✅ [KeycloakRefresh] Tokens refreshed and cookies set");
    return response;
  } catch (err: any) {
    console.error("💥 [KeycloakRefresh] Server error:", err.message || err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

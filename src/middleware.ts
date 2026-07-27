import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export const runtime = "experimental-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  const enableLogs = host.includes("localhost") || host.includes("ech-ry.com");
  if (enableLogs) console.log("🔍 [Middleware]", pathname);

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (enableLogs) console.error("❌ [Middleware] JWT_SECRET missing");
    return NextResponse.next();
  }

  const secret = new TextEncoder().encode(jwtSecret);

  const verifyToken = async (token?: string) => {
    if (!token) return null;
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload;
    } catch {
      return null;
    }
  };

  const token = req.cookies.get("auth_token")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // 🔹 Vérifie les routes protégées
  const protectedRoutes = ["/profile", "/admin"];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    let payload = await verifyToken(token);

    // 🔹 Si token invalide mais refreshToken présent → déclenche refresh
    if (!payload && refreshToken) {
      if (enableLogs) console.log("⚠️ [Middleware] Token expired, trying refresh...");

      const refreshUrl =
        pathname.startsWith("/admin")
          ? `${process.env.NEXTAUTH_URL}/api/auth/refresh/cognito`
          : `${process.env.NEXTAUTH_URL}/api/auth/refresh/cognito`;

      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        headers: { cookie: req.headers.get("cookie") || "" },
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const newToken = data?.token;

        if (newToken) {
          const response = NextResponse.next();
          response.cookies.set("auth_token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "lax",
          });
          if (enableLogs) console.log("✅ [Middleware] Token refreshed successfully");
          return response;
        }
      }

      if (enableLogs) console.error("❌ [Middleware] Refresh failed");
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, req.url));
    }

    // 🔹 Si pas de token → redirection login
    if (!payload) {
      if (enableLogs) console.warn("🔒 No token → redirect login");
      return NextResponse.redirect(new URL(`/login?redirect=${pathname}`, req.url));
    }

    // 🔹 Vérification admin
    if (pathname.startsWith("/admin")) {
      const groups: string[] = Array.isArray(payload["cognito:groups"])
        ? payload["cognito:groups"]
        : Array.isArray(payload.groups)
        ? payload.groups
        : [];

      const role = payload.role ?? (groups.includes("admin") ? "admin" : "user");

      if (role !== "admin") {
        if (enableLogs) console.warn("⛔ Not admin → redirect /");
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (enableLogs) console.log("✅ Access granted");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/profile", "/profile/:path*"],
};

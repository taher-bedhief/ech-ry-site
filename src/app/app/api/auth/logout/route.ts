import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("🔍 [Logout] Endpoint triggered");

  const isProd = request.url.includes("ech-ry.com");
  const redirectUrl = isProd
    ? "https://www.ech-ry.com/login"
    : "http://localhost:3000/login";

  const response = NextResponse.redirect(redirectUrl);

  // 🔹 Supprimer les cookies
  response.cookies.delete("auth_token");
  response.cookies.delete("refreshToken");
  response.cookies.delete("accessToken");

  console.log("✅ [Logout] Cookies cleared successfully");
  console.log(`➡️ [Logout] Redirecting user to: ${redirectUrl}`);

  return response;
}

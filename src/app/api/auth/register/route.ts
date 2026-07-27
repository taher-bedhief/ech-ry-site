import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // 🔹 Appel direct à l’API Admin de Keycloak pour créer un utilisateur
    const adminTokenRes = await fetch(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
        }),
      }
    );

    if (!adminTokenRes.ok) {
      console.error("❌ [Register] Failed to get admin token:", await adminTokenRes.text());
      return NextResponse.json({ success: false, error: "Admin auth failed" }, { status: 500 });
    }

    const { access_token: adminToken } = await adminTokenRes.json();

    // 🔹 Créer l’utilisateur dans Keycloak
    const createRes = await fetch(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          username: email,
          email,
          firstName: name,
          enabled: true,
          credentials: [
            {
              type: "password",
              value: password,
              temporary: false,
            },
          ],
        }),
      }
    );

    if (!createRes.ok) {
      console.error("❌ [Register] Failed to create user:", await createRes.text());
      return NextResponse.json({ success: false, error: "User creation failed" }, { status: 500 });
    }

    console.log("✅ [Register] User created successfully in Keycloak");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("💥 [Register] Server error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

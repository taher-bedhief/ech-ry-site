import { NextRequest, NextResponse } from "next/server";
import {
  CognitoIdentityProviderClient,
  ChangePasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    console.log("🔹 [ChangePassword] Request received");

    const body = await req.json();
    const { oldPassword, newPassword } = body;
    console.log("📦 [ChangePassword] Body received:", body);

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          toast: {
            title: "Missing Fields",
            description: "Old password and new password are required.",
            variant: "destructive",
          },
        },
        { status: 400 }
      );
    }

    // 🔹 Read Cognito accessToken from cookies
    const accessToken = req.cookies.get("accessToken")?.value;
    console.log("🔑 [ChangePassword] accessToken found:", accessToken ? "YES" : "NO");

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          toast: {
            title: "Unauthorized",
            description: "No Cognito access token found. Please log in again.",
            variant: "destructive",
          },
        },
        { status: 401 }
      );
    }

    // ✅ Initialize Cognito client
    const client = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION,
    });

    // ✅ Prepare the command
    const command = new ChangePasswordCommand({
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword,
      AccessToken: accessToken,
    });

    try {
      const result = await client.send(command);
      console.log("✅ [ChangePassword] Cognito response:", result);

      // ✅ Force logout: delete cookies
      const res = NextResponse.json({
        success: true,
        toast: {
          title: "Password Changed",
          description: "Your password has been updated. You have been logged out, please log in again.",
          variant: "success",
        },
      });

      res.cookies.delete("token");
      res.cookies.delete("accessToken");
      res.cookies.delete("refreshToken");

      console.log("🎯 [ChangePassword] Cookies deleted, user logged out");

      return res;
    } catch (err: any) {
      console.error("❌ [ChangePassword] Cognito error:", err);
      return NextResponse.json(
        {
          success: false,
          toast: {
            title: "Password Change Failed",
            description: err.message || "Error changing password",
            variant: "destructive",
          },
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("❌ [ChangePassword] Internal error:", err);
    return NextResponse.json(
      {
        success: false,
        toast: {
          title: "Internal Error",
          description: "Unexpected server error occurred.",
          variant: "destructive",
        },
      },
      { status: 500 }
    );
  }
}

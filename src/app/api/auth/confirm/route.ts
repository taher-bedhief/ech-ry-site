import { NextResponse } from "next/server";
import AWS from "aws-sdk";

AWS.config.update({ region: "eu-west-3" });
const cognito = new AWS.CognitoIdentityServiceProvider();

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: "Email and code are required" },
        { status: 400 }
      );
    }

    try {
      // 🔹 Tentative de confirmation
      await cognito
        .confirmSignUp({
          ClientId: process.env.COGNITO_CLIENT_ID!,
          Username: email,
          ConfirmationCode: code,
        })
        .promise();

      console.log("✅ [Confirm] User confirmed:", email);

      return NextResponse.json({
        success: true,
        message: "User confirmed successfully",
      });
    } catch (err: any) {
      console.warn("⚠️ [Confirm] Cognito error:", err.code);

      // 🔹 Cas particulier : code invalide ou expiré
      if (
        err.code === "CodeMismatchException" ||
        err.code === "ExpiredCodeException"
      ) {
        // Vérifier si l'utilisateur est déjà CONFIRMED
        const user = await cognito
          .adminGetUser({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email,
          })
          .promise();

        if (user.UserStatus === "CONFIRMED") {
          console.log("ℹ️ [Confirm] User already confirmed:", email);
          return NextResponse.json({
            success: true,
            message: "User already confirmed",
          });
        }
      }

      // 🔹 Autres erreurs
      return NextResponse.json(
        { success: false, error: err.message || "Failed to confirm user" },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("💥 [Confirm] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}

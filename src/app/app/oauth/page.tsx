"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { exchangeCodeForToken, createClientCookie } from "@/app/actions.client";
import { setCurrentUser, setAuthenticated } from "@/lib/features/auth/authSlice";
import jwtDecode from "jwt-decode";

// Type des claims OAuth (Cognito ou Google)
type OAuthClaims = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  iss?: string;
};

export default function OAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const handleOAuth = async () => {
      try {
        // 1️⃣ Échange du code OAuth contre tokens
        const tokens = await exchangeCodeForToken(code);
        console.log("✅ Tokens reçus:", tokens);

        // 2️⃣ Stocker le token dans un cookie pour /api/auth/me
        createClientCookie("auth_token", tokens.id_token, {
          path: "/",
          maxAge: 60 * 60 * 24, // 1 jour
          sameSite: "lax",
          secure: ["localhost", "ech-ry.local"].includes(window.location.hostname)
            ? false
            : true,
        });

        // 3️⃣ Décoder le token
        const claims = jwtDecode(tokens.id_token) as OAuthClaims;
        console.log("✅ Claims décodés:", claims);

        // Détecter le provider
        const provider =
          claims.iss?.includes("accounts.google.com") ? "Google" : "Cognito";

        // 4️⃣ Mettre à jour Redux
        dispatch(
          setCurrentUser({
            id: claims.sub,
            email: claims.email ?? "",
            name: claims.name ?? claims.email?.split("@")[0] ?? "Unknown",
            picture: claims.picture ?? undefined,
            role: "user",
            provider,
          })
        );
        dispatch(setAuthenticated(true));

        console.log("✅ Redux mis à jour avec:", claims);

        // 5️⃣ Rediriger vers la home
        router.replace("/");
      } catch (err) {
        console.error("❌ OAuth error:", err);
      }
    };

    handleOAuth();
  }, [searchParams, router, dispatch]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg font-medium">Authenticating...</p>
    </div>
  );
}

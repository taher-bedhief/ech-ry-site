"use client";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");

    if (auth.isAuthenticated && code) {
      const handleBackendCallback = async () => {
        try {
 
          const res = await fetch(`/api/auth/google/callback?code=${code}`, {
            method: "GET",
            credentials: "include",
          });
          const data = await res.json();

          if (data.success) {
  
            router.push("/");
          } else {
            router.push("/login?error=callback_failed");
          }
        } catch (err) {
          console.error("Callback error:", err);
          router.push("/login?error=server_error");
        }
      };

      handleBackendCallback();
    }
  }, [auth.isAuthenticated, router, searchParams]);

  if (auth.isLoading) return <p>Connexion en cours...</p>;
  if (auth.error) return <p>Erreur: {auth.error.message}</p>;

  return <p>Authentifié, redirection...</p>;
}

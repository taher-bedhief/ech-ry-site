"use client";

import React, { useEffect } from "react";
import {
  AuthProvider as OIDCProvider,
  useAuth as useOIDCAuth,
} from "react-oidc-context";
import { useDispatch } from "react-redux";
import {
  setAuthenticated,
  setCurrentUser,
} from "@/lib/features/auth/authSlice";
import cognitoAuthConfig from "@/oidc-config";

/**
 * Fournit la logique Cognito / Google OAuth à toute l'application
 */
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <OIDCProvider {...cognitoAuthConfig}>
      <AuthSync>{children}</AuthSync>
    </OIDCProvider>
  );
};

export default AuthProvider;

/**
 * Synchronise l'état utilisateur Cognito avec Redux
 */
const AuthSync: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const auth = useOIDCAuth();

  useEffect(() => {
    if (auth.isLoading) {
      console.log("⏳ [AuthSync] Chargement de la session OIDC...");
      return;
    }

    if (auth.error) {
      console.error("❌ [AuthSync] Erreur OIDC:", auth.error);
      dispatch(setAuthenticated(false));
      dispatch(setCurrentUser(null));
      localStorage.removeItem("currentUser");
      return;
    }

    if (auth.user) {
      // ✅ Mappe les infos utilisateur Cognito vers Redux
      const mappedUser = {
        id: auth.user.profile.sub,
        name: auth.user.profile.name || "Unknown",
        email: auth.user.profile.email || "",
        picture: auth.user.profile.picture || undefined,
        provider: "Cognito" as const,
      };

      dispatch(setCurrentUser(mappedUser));
      dispatch(setAuthenticated(true));
      localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      console.log("✅ [AuthSync] Utilisateur connecté:", mappedUser);
    } else {
      dispatch(setCurrentUser(null));
      dispatch(setAuthenticated(false));
      localStorage.removeItem("currentUser");
      console.log("🔒 [AuthSync] Aucun utilisateur connecté");
    }
  }, [auth.user, auth.error, auth.isLoading, dispatch]);

  return <>{children}</>;
};

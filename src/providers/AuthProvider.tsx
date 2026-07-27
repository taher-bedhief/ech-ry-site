"use client";

import { AuthProvider } from "react-oidc-context";
import cognitoAuthConfig from "@/oidc-config";

export default function CognitoAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
}

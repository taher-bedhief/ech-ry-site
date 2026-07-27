"use client";

import React from "react";
import { AuthProvider, AuthProviderProps } from "react-oidc-context";

type CognitoProviderProps = {
  children: React.ReactNode;
};

const cognitoAuthConfig: AuthProviderProps = {
  authority: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
  redirect_uri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!,
  post_logout_redirect_uri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI!,
  response_type: "code",
  scope: process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid email profile",
  automaticSilentRenew: true,
  loadUserInfo: true,
  metadata: {
    authorization_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/authorize`,
    token_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/token`,
    userinfo_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`,
    end_session_endpoint: `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/logout`,
  },
  extraQueryParams: {
    prompt: "select_account",
  },
  onSigninCallback: () => {
    // Nettoie l’URL après callback
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const CognitoProvider = ({ children }: CognitoProviderProps) => {
  return <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>;
};

export default CognitoProvider;

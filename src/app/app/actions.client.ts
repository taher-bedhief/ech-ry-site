"use client";

import axios from "axios";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode"; // ✅ import par défaut

type CognitoIdToken = {
  email?: string;
  name?: string;
  sub: string;
};

/**
 * Crée ou met à jour un cookie côté client
 */
export const createClientCookie = (
  name: string,
  value: string,
  options: Cookies.CookieAttributes = {}
) => {
  Cookies.set(name, value, {
    path: "/",
    secure: true,          // ✅ garantit HTTPS
    sameSite: "strict",    // ✅ empêche CSRF
    ...options,
  });
};

/**
 * Supprime un cookie côté client
 */
export const removeClientCookie = (name: string) => {
  Cookies.remove(name, { path: "/" });
};

/**
 * Récupère la valeur d’un cookie côté client
 */
export const getClientCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

/**
 * Échange le code OAuth Cognito contre un token
 */
export const exchangeCodeForToken = async (code: string) => {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!,
    code,
  });

  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/oauth2/token`,
    params,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  return res.data; // contient access_token, id_token, refresh_token
};

/**
 * Récupère l’email depuis l’id_token Cognito
 */
export const getEmailFromIdToken = (idToken: string): string | null => {
  try {
    // ✅ cast explicite pour éviter l’erreur TS
    const decoded = jwtDecode(idToken) as CognitoIdToken;
    return decoded.email || null;
  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
};

/**
 * Récupère les informations de l'utilisateur connecté côté client
 */
export const getUserClient = async (): Promise<any | null> => {
  try {
    const token = Cookies.get("token");
    if (!token) return null;

    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("getUserClient error:", err);
    return null;
  }
};

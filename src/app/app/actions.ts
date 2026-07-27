// actions.ts
import axios from "axios";
import { cookies } from "next/headers";

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns true si connecté, false sinon
 */
export const authenticated = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      withCredentials: true,
    });
    return !!res.data;
  } catch (err) {
    console.error("authenticated error:", err);
    return false;
  }
};

/**
 * Récupère les informations de l'utilisateur connecté
 * @returns objet utilisateur ou null si non connecté
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      withCredentials: true,
    });
    return res.data;
  } catch (err) {
    console.error("getUser error:", err);
    return null;
  }
};

/**
 * Déconnecte l'utilisateur
 * @returns true si succès, false sinon
 */
export const removeCookies = async (): Promise<boolean> => {
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {}, {
      withCredentials: true,
    });
    return true;
  } catch (err) {
    console.error("removeCookies error:", err);
    return false;
  }
};

/**
 * Crée ou met à jour un cookie côté serveur
 * @param name Nom du cookie
 * @param value Valeur du cookie
 */
export const createCookies = (name: string, value: string) => {
  const cookieStore = cookies();
  cookieStore.set(name, value, { path: "/" });
};

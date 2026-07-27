"use server";

import { cookies } from "next/headers";

/**
 * Crée ou met à jour un cookie côté serveur
 */
export const createServerCookie = (name: string, value: string) => {
  const cookieStore = cookies();
  cookieStore.set(name, value, { path: "/" });
};

/**
 * Supprime un cookie côté serveur
 */
export const removeServerCookie = (name: string) => {
  const cookieStore = cookies();
  cookieStore.delete(name);
};

/**
 * Récupère la valeur d’un cookie côté serveur
 */
export const getServerCookie = (name: string): string | undefined => {
  const cookieStore = cookies();
  return cookieStore.get(name)?.value;
};

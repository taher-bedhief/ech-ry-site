import axios from "axios";

// Base URL : en local ou en prod
const baseURL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Instance axios avec configuration par défaut
export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// 🔒 Guard global (ANTI undefined / null)
const isInvalidUrl = (url: string) => {
  return !url || url.includes("undefined") || url.includes("null");
};

// 🔒 Nettoyage des paramètres : supprime les clés vides
const cleanParams = (params: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// Wrapper fetchData
const fetchData = {
  get: async (url: string, params: Record<string, any> = {}) => {
    if (isInvalidUrl(url)) {
      console.error("🚨 BLOCKED API CALL (GET):", url);
      throw new Error("Invalid API URL");
    }

    try {
      const response = await axiosInstance.get(url, { params: cleanParams(params) });
      return response;
    } catch (error) {
      console.error("❌ Error fetching data:", {
        url,
        params: cleanParams(params),
        error,
      });
      throw error;
    }
  },

  post: async (url: string, data: Record<string, any> = {}) => {
    if (isInvalidUrl(url)) {
      console.error("🚨 BLOCKED API CALL (POST):", url);
      throw new Error("Invalid API URL");
    }

    try {
      const response = await axiosInstance.post(url, data);
      return response;
    } catch (error) {
      console.error("❌ Error posting data:", {
        url,
        data,
        error,
      });
      throw error;
    }
  },
};

export default fetchData;

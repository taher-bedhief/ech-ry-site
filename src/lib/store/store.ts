import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

// Fonction pour créer le store (utile avec Next.js App Router)
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

// Instance unique si tu veux l'utiliser directement (ex: tests)
export const store = makeStore();

// ✅ Types pour TypeScript
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

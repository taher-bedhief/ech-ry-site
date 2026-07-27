import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import cartReducer from "./features/cart/cartSlice";
import sidebarReducer from "./features/sidebar/sidebarSlice";

// Fonction qui crée un store (utile pour SSR)
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      sidebar: sidebarReducer,
    },
  });

// Instance unique du store (utile côté client)
export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

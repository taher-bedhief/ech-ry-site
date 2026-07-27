import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Type User compatible avec Cognito/Google
export type User = {
  id?: string;       // ✅ optionnel
  name?: string;     // ✅ optionnel
  email: string;     // ✅ obligatoire
  picture?: string;  // ✅ optionnel
  [key: string]: any;
};

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}

// ✅ État initial sans localStorage (safe côté serveur)
const initialState: AuthState = {
  isAuthenticated: false,
  currentUser: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    removeCurrentUser: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUser");
      }
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) {
          localStorage.setItem("currentUser", JSON.stringify(action.payload));
        } else {
          localStorage.removeItem("currentUser");
        }
      }
    },
  },
});

export const { setAuthenticated, removeCurrentUser, setCurrentUser } =
  authSlice.actions;

export default authSlice.reducer;

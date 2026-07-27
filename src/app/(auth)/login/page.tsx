"use client";

import { LoginForm } from "@/components/forms/LoginForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

        {/* ✅ Formulaire de login */}
        <LoginForm />

        {/* ✅ Container pour afficher les toasts */}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </div>
    </div>
  );
}

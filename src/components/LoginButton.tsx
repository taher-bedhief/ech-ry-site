"use client";
import { useAuth } from "react-oidc-context";

export default function LoginButton() {
  const auth = useAuth();

  if (auth.isLoading) return <p>Loading...</p>;

  if (auth.isAuthenticated) {
    return (
      <button
        onClick={() => auth.signoutRedirect()}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Logout
      </button>
    );
  }

  return (
    <button
      onClick={() => auth.signinRedirect()}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Login
    </button>
  );
}

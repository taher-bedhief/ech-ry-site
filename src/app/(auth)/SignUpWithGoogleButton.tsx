"use client";

export default function SignUpWithGoogleButton() {
  const handleClick = () => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!;
    const scopes = process.env.NEXT_PUBLIC_COGNITO_SCOPES || "openid email profile";

    const url = `${domain}/oauth2/authorize?identity_provider=Google&response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&prompt=select_account`;

    window.location.href = url;
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
    >
      Sign Up with Google
    </button>
  );
}

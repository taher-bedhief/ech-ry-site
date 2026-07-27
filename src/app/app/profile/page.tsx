import ProfileForm from "@/components/forms/ProfileForm";
import { Metadata } from "next";
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/utils";

export const metadata: Metadata = {
  title: "Profile",
  description:
    "EchRy is the user-friendly Next.js eCommerce template perfect for launching your online store. With its clean design and customizable options, EchRy makes selling online a breeze. Start building your dream store today and boost your online presence effortlessly!",
};

const ProfilePage = async () => {
  // ✅ Use the correct cookie name
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login?redirect=/profile");
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    redirect("/login?redirect=/profile");
  }

  return (
    <section className="profile-page">
      <ProfileForm />
    </section>
  );
};

export default ProfilePage;

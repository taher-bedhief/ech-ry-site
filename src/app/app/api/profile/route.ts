import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// ====== Schemas ======
const AddressSchema = new mongoose.Schema({
  title: String,
  phone: String,
  streetAddress: String,
  city: String,
  state: String,
  country: String,
  zip: String,
});

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    role: String,
    avatar: String,
    bio: String,
    billingAddress: AddressSchema,
    shippingAddress: AddressSchema,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ====== GET PROFILE ======
export async function GET() {
  await dbConnect();

  try {
    // 🔐 1. Lire le cookie
    const token = cookies().get("auth_token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔐 2. Vérifier le JWT
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as { email: string };

    if (!payload?.email) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    // 🧠 3. Charger l’utilisateur
    const user = await User.findOne({ email: payload.email });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // ✅ 4. Réponse
    return NextResponse.json({
      fullName: user.name,
      email: user.email,
      billingAddress: user.billingAddress || null,
      shippingAddress: user.shippingAddress || null,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

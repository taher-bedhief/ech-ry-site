import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";
import { requireAuth } from "@/lib/auth/utils";

// =======================================
// 🔹 PUT: Mettre à jour les adresses par défaut du profil
// - User connecté : peut modifier billingAddress et shippingAddress
// =======================================
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    if (auth.role !== "user") {
      return NextResponse.json({ error: "Only users can update addresses" }, { status: 403 });
    }

    const body = await request.json();
    const { billingAddress, shippingAddress } = body;

    const user = await User.findOne({ email: auth.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (billingAddress) user.billingAddress = billingAddress;
    if (shippingAddress) user.shippingAddress = shippingAddress;

    await user.save();

    return NextResponse.json({
      message: "✅ Addresses updated successfully",
      user: {
        email: user.email,
        billingAddress: user.billingAddress,
        shippingAddress: user.shippingAddress,
      },
    });
  } catch (error: any) {
    console.error("❌ Error updating addresses:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

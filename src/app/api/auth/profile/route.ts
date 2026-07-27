import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  await dbConnect();

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing OIDC token" }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!); // ✅ vérification signature

    const email =
      decoded?.email ||
      decoded?.preferred_username ||
      decoded?.upn ||
      decoded?.sub;

    if (!email) {
      return NextResponse.json({ error: "No email in token" }, { status: 400 });
    }

    let fallbackName =
      decoded?.name ||
      decoded?.given_name ||
      decoded?.family_name ||
      decoded?.preferred_username ||
      email.split("@")[0];

    const avatar = decoded?.picture || "/icons/avatar.png";

    let user = await User.findOne({ email }).select(
      "name email avatar bio billingAddress shippingAddress role createdAt updatedAt"
    );

    if (!user) {
      user = new User({ email, name: fallbackName, avatar, role: "user" });
      await user.save();
    } else {
      if (!user.name) user.name = fallbackName;
      if (!user.avatar) user.avatar = avatar;
      await user.save();
    }

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("Erreur OIDC:", err.message || err);
    return NextResponse.json({ error: "Invalid OIDC token" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  await dbConnect();

  const token = req.cookies.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing OIDC token" }, { status: 401 });
  }

  const decoded: any = jwt.verify(token, process.env.JWT_SECRET!); // ✅ vérification signature
  const emailFromToken =
    decoded?.email ||
    decoded?.preferred_username ||
    decoded?.upn ||
    decoded?.sub;

  const body = await req.json();
  const { email, name, avatar, bio, billingAddress, shippingAddress } = body;

  if (!email || email !== emailFromToken) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      name: name || email.split("@")[0],
      avatar: avatar || "/icons/avatar.png",
      bio,
      billingAddress,
      shippingAddress,
      role: "user",
    });
  } else {
    if (name !== undefined) user.name = name || email.split("@")[0];
    if (avatar !== undefined) user.avatar = avatar || user.avatar;
    if (bio !== undefined) user.bio = bio || user.bio;
    if (billingAddress !== undefined) user.billingAddress = billingAddress;
    if (shippingAddress !== undefined) user.shippingAddress = shippingAddress;
  }

  await user.save();
  return NextResponse.json(user);
}

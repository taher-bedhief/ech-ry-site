import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/lib/models/order";
import { requireAuth } from "@/lib/auth/utils";

// =======================================
// 🔹 GET: Récupérer toutes les commandes ou une commande par ID (admin uniquement)
// =======================================
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ order });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const totalCount = await Order.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = orders.map((order) => ({
      ...order.toObject(),
      orderNumber: order.orderNumber,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      totalCount,
      totalPages,
      currentPage: page,
      limit,
    });
  } catch (error: any) {
    console.error("❌ Error fetching admin orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

// =======================================
// 🔹 PUT: Mettre à jour le statut d’une commande (admin uniquement)
// =======================================
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const body = await request.json();
    const { status } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.status = status || order.status;
    await order.save();

    return NextResponse.json({
      message: "✅ Order status updated successfully",
      order,
    });
  } catch (error: any) {
    console.error("❌ Error updating admin order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

// =======================================
// 🔹 DELETE: Supprimer une commande (admin uniquement)
// =======================================
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await Order.deleteOne({ _id: orderId });

    return NextResponse.json({ message: "✅ Order deleted successfully", orderId });
  } catch (error: any) {
    console.error("❌ Error deleting admin order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

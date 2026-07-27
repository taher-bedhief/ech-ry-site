import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/lib/models/order";
import User from "@/lib/models/user";
import Product from "@/lib/models/product";
import { requireAuth } from "@/lib/auth/utils";
import Cart from "@/lib/models/cart";
import mongoose from "mongoose";

// =======================================
// 🔹 Utilitaire stock/ventes/réservations
// =======================================
async function updateStockAndSales(items: any[], action: "reserve" | "decrement" | "increment") {
  for (const item of items) {
    const productDoc = await Product.findOne({ originalId: item.productId });
    if (productDoc) {
      if (action === "reserve") {
        productDoc.reserved = (productDoc.reserved || 0) + item.quantity;
      } else if (action === "decrement") {
        productDoc.amount -= item.quantity;
        productDoc.sales = (productDoc.sales || 0) + item.quantity;
        productDoc.reserved = Math.max(0, (productDoc.reserved || 0) - item.quantity);
      } else if (action === "increment") {
        productDoc.amount += item.quantity;
        productDoc.sales = Math.max(0, (productDoc.sales || 0) - item.quantity);
        productDoc.reserved = Math.max(0, (productDoc.reserved || 0) - item.quantity);
      }
      await productDoc.save();
    }
  }
}

// =======================================
// 🔹 GET: Récupérer les commandes
// =======================================
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let query: any = {};
    if (auth.role !== "admin") query.user = auth.email;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      subtotal: order.subtotal || 0,
      shippingCost: order.shippingCost || 0,
      taxCost: order.taxCost || 0,
      total: order.total,
      status: order.status,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    }));

    return NextResponse.json({ orders: formattedOrders, page, limit });
  } catch (error: any) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

// =======================================
// 🔹 POST: Créer une nouvelle commande
// =======================================
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    // ✅ Correction : on n’interdit plus les admins
    // if (auth.role === "admin") {
    //   return NextResponse.json({ error: "Admins cannot create orders" }, { status: 403 });
    // }

    const body = await request.json();
    const { shippingAddress, billingAddress, paymentMethod, items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid order items" }, { status: 400 });
    }

    const processedItems = [];
    for (const item of items) {
      const productId = item.productId || item._id || item.id;

      let productDoc;
      if (mongoose.Types.ObjectId.isValid(productId)) {
        productDoc = await Product.findById(productId);
      } else {
        productDoc = await Product.findOne({ originalId: productId });
      }

      if (!productDoc) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      if (productDoc.amount < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${productDoc.title}` }, { status: 400 });
      }

      processedItems.push({
        productId: productDoc.originalId,
        title: productDoc.title,
        price: productDoc.price,
        quantity: item.quantity,
        image: Array.isArray(productDoc.image) ? productDoc.image[0] : productDoc.image,
        category: productDoc.shop_category,
        promo: productDoc.promo,
        oldPrice: productDoc.oldPrice,
      });
    }

    const subtotal = processedItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
    const shippingCost = subtotal > 500 ? 0 : 10;
    const taxRate = 0.05;
    const taxCost = parseFloat((subtotal * taxRate).toFixed(2));
    const total = subtotal + shippingCost + taxCost;

    const userDoc = await User.findOne({ email: auth.email });

    let status = "pending";
    let paymentStatus = "pending";
    if (paymentMethod === "Visa" || paymentMethod === "MasterCard") {
      status = "processing";
      paymentStatus = "paid";
      await updateStockAndSales(processedItems, "reserve");
    } else if (paymentMethod === "Cash on Delivery") {
      status = "pending";
      paymentStatus = "pending";
    }

    const order = await Order.create({
      user: auth.email,
      userInfo: {
        name: userDoc?.name || auth.name || shippingAddress?.fullName || "Unknown",
        email: userDoc?.email || auth.email || "Unknown",
        role: userDoc?.role || auth.role || "user",
      },
      items: processedItems,
      subtotal,
      shippingCost,
      taxCost,
      total,
      shippingAddress,
      billingAddress,
      paymentMethod,
      status,
      paymentStatus,
    });

    const productAnalyticsCollection = mongoose.connection.db.collection("productAnalytics");
    let totalPurchasedQty = 0;

    for (const item of processedItems) {
      totalPurchasedQty += item.quantity;

      const result = await productAnalyticsCollection.updateOne(
        { userId: auth.email, "products.productId": item.productId },
        {
          $inc: { "products.$.purchased": item.quantity },
          $set: {
            "products.$.productName": item.title,
            "products.$.category": item.category ?? "unknown",
            "products.$.promo": item.promo ?? false,
            "products.$.price": item.price ?? 0,
            "products.$.oldPrice": item.oldPrice ?? 0,
            "products.$.image": Array.isArray(item.image) ? item.image[0] : item.image || "/placeholder.jpg",
            updatedAt: new Date(),
          },
        }
      );

      if (result.matchedCount === 0) {
        await productAnalyticsCollection.updateOne(
          { userId: auth.email },
          {
            $push: {
              products: {
                productId: item.productId,
                productName: item.title,
                category: item.category ?? "unknown",
                promo: item.promo ?? false,
                price: item.price ?? 0,
                oldPrice: item.oldPrice ?? 0,
                purchased: item.quantity,
              },
            },
            $setOnInsert: { userId: auth.email, createdAt: new Date() },
            $set: { updatedAt: new Date() },
          },
          { upsert: true }
        );
      }
    }

    await productAnalyticsCollection.updateOne(
      { userId: auth.email },
      { $inc: { purchasedTotal: totalPurchasedQty }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );

    await Cart.deleteMany({ user: auth.email });
    await User.updateOne({ email: auth.email }, { $set: { cartItems: [] } });

    return NextResponse.json({
      message: "✅ Order created successfully",
      order,
    });
  } catch (error: any) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

// =======================================
// 🔹 PUT: Mettre à jour le statut d’une commande
// =======================================
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const { status } = await request.json();

       if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const oldStatus = order.status;

    if (oldStatus === "pending" && status === "shipped") {
      return NextResponse.json({ error: "Invalid transition: pending → shipped" }, { status: 400 });
    }

    order.status = status || order.status;

    if (oldStatus === "processing" && order.status === "shipped") {
      await updateStockAndSales(order.items, "decrement");
    }

    if (order.status === "cancelled" && oldStatus !== "cancelled") {
      await updateStockAndSales(order.items, "increment");
      if (auth.role === "admin" && order.paymentStatus === "paid") {
        order.paymentStatus = "refunded";
      }
    }

    if (order.status === "completed" && order.paymentMethod === "Cash on Delivery") {
      order.paymentStatus = "paid";
    }

    await order.save();
    return NextResponse.json({ message: "✅ Order status updated successfully", order });
  } catch (error: any) {
    console.error("❌ Error updating order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

// =======================================
// 🔹 DELETE: Supprimer une commande
// =======================================
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    let query: any = { _id: orderId };
    if (auth.role !== "admin") query.user = auth.email;

    const order = await Order.findOne(query);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await updateStockAndSales(order.items, "increment");

    await Order.deleteOne(query);
    return NextResponse.json({ message: "✅ Order deleted successfully", orderId });
  } catch (error: any) {
    console.error("❌ Error deleting order:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: error.message === "Authentication required" ? 401 : 500 }
    );
  }
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  user: string;
  userInfo?: { name?: string; email?: string; role?: string };
  shippingAddress?: {
    fullName: string;
    streetAddress?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    fullName: string;
    streetAddress?: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 🔹 Mapping des transitions valides
  const validTransitions: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["completed"],
    completed: [],
    cancelled: [],
  };

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch order");

      setOrder(data.order);
    } catch (err) {
      console.error("❌ Error fetching order:", err);
      toast.error("❌ Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function updateStatus(newStatus: string) {
    if (!order) return;

    // Vérifier si la transition est valide
    if (!validTransitions[order.status].includes(newStatus)) {
      toast.error(`❌ Transition invalide: ${order.status} → ${newStatus}`);
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/orders?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setOrder(data.order);
      toast.success(`✅ Status updated to "${newStatus}"`);
    } catch (err) {
      console.error("❌ Error updating status:", err);
      toast.error("❌ Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <p className="text-center py-6">Loading order details...</p>;
  if (!order) return <p className="text-center py-6">Order not found</p>;

  const statusColors: Record<string, string> = {
    pending: "bg-orange-200 text-orange-700",
    processing: "bg-blue-200 text-blue-700",
    shipped: "bg-purple-200 text-purple-700",
    delivered: "bg-green-200 text-green-700",
    completed: "bg-green-300 text-green-800",
    cancelled: "bg-red-200 text-red-700",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Bouton retour */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/admin/orders")}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          ← Back to Orders
        </button>
      </div>

      {/* Titre */}
      <h1 className="text-2xl font-bold mb-6 text-center">
        Order Details - {order.orderNumber}
      </h1>

      {/* Infos utilisateur */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-lg mb-2">👤 User</h2>
        <p>{order.userInfo?.name || "Unknown"} ({order.userInfo?.email || order.user})</p>
      </div>

      {/* Adresses */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-2">📦 Shipping Address</h2>
          <p>{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.streetAddress}</p>
          <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
          <p>{order.shippingAddress?.country}</p>
        </div>
        {order.billingAddress && (
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-2">💳 Billing Address</h2>
            <p>{order.billingAddress?.fullName}</p>
            <p>{order.billingAddress?.streetAddress}</p>
            <p>{order.billingAddress?.city}, {order.billingAddress?.postalCode}</p>
            <p>{order.billingAddress?.country}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-lg mb-4">🛒 Items</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-center">Price</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{item.title}</td>
                <td className="p-2 text-center">${item.price}</td>
                <td className="p-2 text-center">{item.quantity}</td>
                <td className="p-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Résumé */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-lg mb-2">📊 Summary</h2>
        <p>
          Status:{" "}
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
          >
            {order.status}
          </span>
        </p>
        <p className="mt-2 font-bold">Total: ${order.total.toFixed(2)}</p>
      </div>

      {/* Boutons de mise à jour du statut */}
      <div className="flex flex-wrap gap-2">
        {["pending", "processing", "shipped", "delivered", "completed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={updating || !validTransitions[order.status].includes(s)}
            className={`px-3 py-1 rounded-full text-sm text-white ${
              order.status === s
                ? "bg-gray-500"
                : validTransitions[order.status].includes(s)
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

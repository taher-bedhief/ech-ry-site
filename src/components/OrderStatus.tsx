"use client";

import { useState } from "react";

type OrderStatusProps = {
  orderId: string;
  currentStatus: string;
};

export default function OrderStatus({ orderId, currentStatus }: OrderStatusProps) {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Mapping des transitions valides
  const validTransitions: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: ["completed"],
    completed: [],
    cancelled: [],
  };

  async function updateOrderStatus(newStatus: string) {
    setError(null);

    // Vérifier si la transition est valide
    if (!validTransitions[status].includes(newStatus)) {
      setError(`❌ Transition invalide: ${status} → ${newStatus}`);
      return;
    }

    setStatus(newStatus);

    try {
      const res = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update order status");
      }

      const data = await res.json();
      console.log("✅ Order updated:", data);
    } catch (err: any) {
      console.error("❌ Error updating order:", err);
      setError(err.message);
      setStatus(currentStatus); // rollback si erreur
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Status:</label>
        <select
          value={status}
          onChange={(e) => updateOrderStatus(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {error && <p className="text-red-500 text-xs">❌ {error}</p>}
    </div>
  );
}

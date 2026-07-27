"use client";

import { useEffect, useState, useCallback } from "react";
import { FaTrash, FaSync } from "react-icons/fa";
import OrderStatus from "@/components/OrderStatus"; 
import Paginations from "@/components/Paginations"; 

type Order = {
  _id: string;
  orderNumber: string;
  status: string;
  total: number;
  user: string;
  userInfo?: { name?: string; email?: string; role?: string };
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Charger les commandes avec pagination
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&limit=10`, { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch orders");
      }

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  // ✅ Charger au montage et à chaque changement de page
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ✅ Supprimer une commande
  async function deleteOrder(orderId: string) {
    try {
      await fetch(`/api/admin/orders?id=${orderId}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
    } catch (err) {
      console.error("❌ Error deleting order:", err);
    }
  }

  if (loading && !refreshing) return <p className="text-center py-6">Loading orders...</p>;

  return (
    <div className="p-6">
      {/* ✅ Bouton Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setRefreshing(true);
            fetchOrders();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
            refreshing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={refreshing}
        >
          <FaSync className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <h1 className="text-xl font-bold mb-6 text-center">Admin - Manage Orders</h1>
      <table className="w-full border-collapse border text-center shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3">Order #</th>
            <th className="border p-3">User</th>
            <th className="border p-3">Total</th>
            <th className="border p-3">Status</th>
            <th className="border p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="hover:bg-gray-50">
              <td className="border p-3 font-semibold">
                <a
                  href={`/admin/orders/${order._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {order.orderNumber}
                </a>
              </td>
              <td className="border p-3 text-left">
                <div className="font-bold">{order.userInfo?.name || "—"}</div>
                <div className="text-sm text-gray-600">{order.userInfo?.email || order.user}</div>
                {order.userInfo?.role && (
                  <span
                    className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      order.userInfo.role === "admin"
                        ? "bg-green-200 text-green-700"
                        : "bg-blue-200 text-blue-700"
                    }`}
                  >
                    {order.userInfo.role}
                  </span>
                )}
              </td>
              <td className="border p-3">${order.total.toFixed(2)}</td>
              <td className="border p-3">
                {/* ✅ Composant OrderStatus avec logique de transitions */}
                <OrderStatus orderId={order._id} currentStatus={order.status} />
              </td>
              <td className="border p-3">
                <button
                  onClick={() => deleteOrder(order._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete order"
                >
                  <FaTrash size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Pagination */}
      <Paginations
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(newPage) => setPage(newPage)} 
      />
    </div>
  );
}

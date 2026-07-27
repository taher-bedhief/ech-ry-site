"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface OrderItem {
  product: {
    _id: string;
    title: string;
    price: number;
    image: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total: number;
  status: string;
  shippingAddress: {
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Récupération des commandes
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch orders");
        }

        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // 🔹 Annulation d’une commande
  const handleCancel = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      // ✅ Mise à jour du state local
      setOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: "cancelled" } : order
        )
      );

      // ✅ Toast de confirmation
      toast.success("✅ Order cancelled successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error("❌ Failed to cancel order");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">No orders found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Order ID: {order._id}</p>
                <p className="text-sm text-gray-500">
                  Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Total: ${order.total.toFixed(2)}</p>
                <p className="text-sm capitalize">Status: {order.status}</p>
                {/* 🔹 Bouton Cancel visible seulement si pending ou processing */}
                {(order.status === "pending" || order.status === "processing") && (
                  <button
                    onClick={() => handleCancel(order._id)}
                    className="mt-2 px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Image
                    src={item.product.image}
                    alt={item.product.title}
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.product.title}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Address */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">Shipping Address</h3>
              <p className="text-sm text-gray-600">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.streetAddress}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

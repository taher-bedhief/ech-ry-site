"use client";

import OrderDetails from "@/components/profile/OrderDetails";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Variants, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Order } from "@/types/order";
import { useRouter } from "next/navigation";
import { FaSync } from "react-icons/fa";
import { FaHome } from "react-icons/fa";

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { stiffness: 90 },
  },
  exit: { opacity: 0, x: "100%" },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "shipped":
      return "bg-purple-100 text-purple-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ordersPerPage = 5;

  const router = useRouter();

  const fetchOrders = async (pageNum: number = 1) => {
    try {
      if (pageNum === 1) setRefreshing(true);
      setLoading(true);

      const response = await fetch(`/api/orders?page=${pageNum}&limit=${ordersPerPage}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch orders");

      if (pageNum === 1) {
        setOrders(data.orders);
        if (data.orders.length > 0) setSelectedOrder(data.orders[0]);
      } else {
        setOrders(prev => [...prev, ...data.orders]);
      }
      setHasMore(data.orders.length === ordersPerPage);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    setHasMore(true);
    fetchOrders(1);
  };

  // ✅ Nouvelle fonction Cancel
  const handleCancelOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();

      if (res.ok) {
        setOrders(prev =>
          prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o)
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: "cancelled" });
        }
        alert("✅ Order cancelled successfully");
      } else {
        alert(data.error || "❌ Failed to cancel order");
      }
    } catch {
      alert("❌ Error cancelling order");
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Boutons Refresh + Return to Shop */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mb-4">
        <button
          onClick={handleRefresh}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded text-white ${
            refreshing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={refreshing}
        >
          <FaSync className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              if (window.location.host.includes("localhost")) {
                router.push("/");
              } else {
                window.location.href = "https://www.ech-ry.com";
              }
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <FaHome /> Return to Shop
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order._id}
              variants={item}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setSelectedOrder(order)}
              className={`cursor-pointer ${selectedOrder?._id === order._id ? "ring-2 ring-primary" : ""}`}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Order #{order.orderNumber}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          
          {hasMore && !loading && (
            <button
              disabled={loading}
              onClick={() => setPage(prev => prev + 1)}
              className="w-full py-2 bg-secondary text-primary rounded-md hover:bg-secondary/90 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More Orders"}
            </button>
          )}
        </div>

        <div className="bg-secondary p-6 rounded-lg">
          {selectedOrder ? (
            <OrderDetails order={selectedOrder} onCancel={handleCancelOrder} />
          ) : (
            <div className="text-center text-muted-foreground">
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;

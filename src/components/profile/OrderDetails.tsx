import { motion } from "framer-motion";
import { useState } from "react";
import { Order } from "@/types/order";
import Image from "next/image";
import { HiXCircle } from "react-icons/hi";

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type OrderDetailsProps = {
  order: Order;
  onCancel?: (orderId: string) => Promise<void>; 
};

const OrderDetails = ({ order, onCancel }: OrderDetailsProps) => {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-200 text-green-600";
      case "processing":
        return "bg-yellow-200 text-yellow-600";
      case "pending":
        return "bg-orange-200 text-orange-600";
      case "cancelled":
        return "bg-red-200 text-red-700"; 
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  return (
    <motion.div variants={itemAnimation} key={order._id} className="order-details mt-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-medium text-lg md:text-2xl">Order #{order.orderNumber}</h1>
        {onCancel && (order.status === "pending" || order.status === "processing") && (
          <button
            onClick={() => onCancel(order._id)}
            className="flex items-center gap-2 px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm"
          >
            <HiXCircle className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* Status + Payment */}
      <div className="bg-accent my-4 rounded-lg p-4 flex justify-between flex-wrap gap-4">
        <div className={`${getStatusColor(order.status)} rounded-lg py-1 px-2 capitalize text-sm`}>
          {order.status}
        </div>
        <div className="bg-green-200 text-green-600 rounded-lg py-1 px-2 capitalize text-sm">
          {order.paymentMethod}
        </div>
      </div>

      {/* Shipping Address + Order Summary */}
      <div className="flex text-sm mt-5 w-full justify-between border-b-2 flex-col gap-3 md:flex-row">
        <div className="basis-1/2 p-4">
          <h4 className="font-medium">Shipping Address</h4>
          <p className="text-muted-foreground mt-2">
            {order.shippingAddress.fullName}<br />
            {order.shippingAddress.streetAddress}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}
          </p>
        </div>
        <div className="basis-1/2 p-4 border-l">
          <h4 className="font-medium">Order Summary</h4>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>${order.shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${order.taxCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="font-medium">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 p-4">
        <h4 className="font-medium mb-4">Order Items</h4>
        <div className="space-y-4">
          {order.items.map((item) => (
            <motion.div
              key={item._id || `order-item-${item.productId}`}
              variants={itemAnimation}
              className="flex items-center gap-4 p-3 bg-accent rounded-lg"
            >
              <div className="h-16 w-16 flex-shrink-0 relative">
                {!imageError[item.productId] ? (
                  <Image
                    src={item.image || "/placeholder.jpg"}   
                    alt={item.title || "Product Unavailable"} 
                    width={80}
                    height={80}
                    className="rounded-lg object-cover"
                    onError={() => setImageError(prev => ({ ...prev, [item.productId]: true }))}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-500">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h5 className="font-medium">{item.title || "Product Unavailable"}</h5>
                <p className="text-sm text-muted-foreground">
                  ${(item.price || 0).toFixed(2)} × {item.quantity || 0}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OrderDetails;

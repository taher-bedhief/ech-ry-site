"use client";

import {
  removeFromCart,
  hydrateCartFromServer,
  clearCart,
  clearCartByEmail,
} from "@/lib/features/cart/cartSlice";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { totalPrice } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Skeleton from "../loader/Skeleton";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { FaTruck, FaCcVisa, FaCcMastercard, FaTrash } from "react-icons/fa";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  { locale: "en" }
);

const paymentMethods = [
  { title: "Cash on Delivery", icon: <FaTruck className="text-xl" /> },
  { title: "Visa", icon: <FaCcVisa className="text-xl text-blue-600" /> },
  { title: "MasterCard", icon: <FaCcMastercard className="text-xl text-red-600" /> },
];

interface OrderSummeryProps {
  shippingData: any;
  billingData: any;
}

const buildFullAddress = (data: any) =>
  [
    data?.fullName,
    data?.phone,
    data?.streetAddress,
    data?.city,
    data?.state,
    data?.postalCode,
    data?.country,
  ]
    .filter(Boolean)
    .join(", ");

const getImageSrc = (item: any) => {
  if (!item.image) return "/placeholder.jpg";
  if (Array.isArray(item.image)) return item.image[0];
  if (typeof item.image === "string") return item.image;
  return "/placeholder.jpg";
};

// === StripePaymentForm ===
function StripePaymentForm({
  total,
  shippingData,
  billingData,
  cartItems,
  selectedMethod,
  saveDefault,
  setSaveDefault,
  dispatch,
}: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const buildOrderData = () => ({
    shippingAddress: { ...shippingData, address: buildFullAddress(shippingData) },
    billingAddress: { ...billingData, address: buildFullAddress(billingData) },
    paymentMethod: selectedMethod,
    items: cartItems.map((item: any) => ({
      productId: item.originalId,
      title: item.title,
      image: getImageSrc(item),
      price: item.price,
      quantity: item.amount ?? 1,
    })),
    subtotal: totalPrice(cartItems),
    shippingCost: totalPrice(cartItems) > 500 ? 0 : 10,
    taxCost: +(totalPrice(cartItems) * 0.05).toFixed(2),
    total,
    paymentStatus: "paid",
    status: "processing",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "usd" }),
      });
      const { clientSecret } = await res.json();

      const cardElement = elements?.getElement(CardElement);
      if (!stripe || !cardElement) throw new Error("Stripe not loaded");

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: { card: cardElement } }
      );

      if (error) {
        alert("❌ Payment failed: " + error.message);
      } else if (paymentIntent?.status === "succeeded") {
        const orderData = buildOrderData();

        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        if (!orderRes.ok) throw new Error("Order creation failed");

        if (saveDefault) {
          await fetch("/api/user/update-address", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              billingAddress: orderData.billingAddress,
              shippingAddress: orderData.shippingAddress,
            }),
          });
        }

        dispatch(clearCart());
        dispatch(clearCartByEmail({ email: billingData?.email }));
        localStorage.removeItem("cartItems_guest");

        window.location.href = "/checkout/success";
      }
    } catch (err: any) {
      alert("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        Card number, expiry date & CVC
      </label>
      <CardElement className="p-3 border rounded-md bg-white" />
      <Button
        disabled={!stripe || loading || !selectedMethod}
        className={`w-full font-semibold ${
          !selectedMethod
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {loading ? "Processing..." : "🔒 Pay with Card"}
      </Button>
    </form>
  );
}

// === OrderSummery ===
const OrderSummery = ({ shippingData, billingData }: OrderSummeryProps) => {
  const { cartItems } = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [saveDefault, setSaveDefault] = useState(false);

  useEffect(() => setIsClient(true), []);

  // Hydrate cart from server
  useEffect(() => {
    const fetchServerCart = async () => {
      try {
        const res = await fetch("/api/cart");
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.items)) {
          const normalizedItems = data.items.map((i: any) => ({
            _id: i._id ?? i.product,
            originalId: i.originalId ?? i.product,
            title: i.title ?? "Product",
            price: i.price,
            amount: i.quantity ?? 1,
            image: Array.isArray(i.image)
              ? i.image
              : i.image
              ? [i.image]
              : ["/placeholder.jpg"],
            unit_of_measure: i.unit_of_measure ?? "",
            shop_category: i.shop_category ?? "",
            promo: i.promo ?? false,
            oldPrice: i.oldPrice ?? 0,
          }));
          dispatch(hydrateCartFromServer(normalizedItems));
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      }
    };
    fetchServerCart();
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem("cartItems_guest", JSON.stringify(cartItems));
  }, [cartItems]);

  if (!isClient) return <Skeleton className="h-40 w-full" />;

  const hasProducts = Array.isArray(cartItems) && cartItems.length > 0;
  const shopUrl =
    typeof window !== "undefined" && window.location.hostname.includes("localhost")
      ? "http://localhost:3000"
      : "https://www.ech-ry.com";

  const subtotal = totalPrice(cartItems);
  const shippingCost = subtotal > 500 ? 0 : 10;
  const taxCost = +(subtotal * 0.05).toFixed(2);
  const total = subtotal + shippingCost + taxCost;

  const buildOrderData = () => ({
    shippingAddress: { ...shippingData, address: buildFullAddress(shippingData) },
    billingAddress: { ...billingData, address: buildFullAddress(billingData) },
    paymentMethod: selectedMethod,
    items: cartItems.map((item) => ({
      productId: item.originalId,
      title: item.title,
      image: getImageSrc(item),
      price: item.price,
      quantity: item.amount ?? 1,
    })),
    subtotal,
    shippingCost,
    taxCost,
    total,
    paymentStatus: selectedMethod === "Cash on Delivery" ? "pending" : "paid",
    status: "processing",
  });

  const placeOrder = async () => {
    if (!selectedMethod) return alert("Select payment method");

        try {
      const orderData = buildOrderData();
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) return alert("❌ Order failed");

      if (saveDefault) {
        await fetch("/api/user/update-address", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingAddress: orderData.billingAddress,
            shippingAddress: orderData.shippingAddress,
          }),
        });
      }

      dispatch(clearCart());
      dispatch(clearCartByEmail({ email: billingData?.email }));
      localStorage.removeItem("cartItems_guest");

      window.location.href = "/checkout/success";
    } catch (err) {
      console.error("❌ Checkout error:", err);
    }
  };

  return (
    <AnimatePresence>
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Order Summary</h2>
          {hasProducts && (
            <Link href={shopUrl} className="text-sm text-blue-600 hover:underline">
              ← Return to Shop
            </Link>
          )}
        </div>

        {/* NO PRODUCTS */}
        {!hasProducts && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <p className="text-gray-500 text-lg">No products selected</p>
            <Link
              href={shopUrl}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition"
            >
              Return to Shop
            </Link>
          </div>
        )}

        {/* PRODUCTS */}
        {hasProducts &&
          cartItems.map((item, index) => (
            <motion.div
              key={item.originalId}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ delay: index * 0.05 }}
              className="flex justify-between items-center border-b pb-2 mb-2"
            >
              <div className="flex gap-3">
                <div className="relative w-14 h-14">
                  {!imageErrors[item.originalId] ? (
                    <Image
                      src={getImageSrc(item)}
                      alt={item.title}
                      fill
                      className="object-cover rounded"
                      onError={() =>
                        setImageErrors((p) => ({ ...p, [item.originalId]: true }))
                      }
                    />
                  ) : (
                    <div className="bg-gray-200 w-full h-full" />
                  )}
                </div>
                <div>
                  <Link
                    href={`/products/${item.originalId}`}
                    className="font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    ${item.price} × {item.amount ?? 1}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold">
                  ${(item.price * (item.amount ?? 1)).toFixed(2)}
                </p>
                <button
                  onClick={async () => {
                    await fetch(`/api/cart?productId=${item.originalId}`, { method: "DELETE" });
                    dispatch(removeFromCart(item.originalId));
                  }}
                  className="text-red-500 hover:text-red-700"
                  title="Remove item"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}

        {/* ADDRESSES */}
        {hasProducts && (
          <div className="border-t pt-4 space-y-2">
            <h3 className="text-lg font-semibold mb-2">Addresses</h3>
            <p className="text-sm text-gray-600">
              <strong>Billing:</strong> {buildFullAddress(billingData)}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Shipping:</strong> {buildFullAddress(shippingData)}
            </p>
          </div>
        )}

        {/* PAYMENT METHODS */}
        {hasProducts && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Select Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <Card
                  key={method.title}
                  onClick={() => setSelectedMethod(method.title)}
                  className={`cursor-pointer ${
                    selectedMethod === method.title ? "border-primary text-primary" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex gap-2 items-center text-sm">
                      {method.icon} {method.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TOTALS */}
        {hasProducts && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>${shippingCost}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>${taxCost}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span>${total}</span></div>
          </div>
        )}

        {/* PAYMENT ACTION */}
        {hasProducts && (
          <>
            {selectedMethod === "Visa" || selectedMethod === "MasterCard" ? (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  total={total}
                  shippingData={shippingData}
                  billingData={billingData}
                  cartItems={cartItems}
                  selectedMethod={selectedMethod}
                  saveDefault={saveDefault}
                  setSaveDefault={setSaveDefault}
                  dispatch={dispatch}
                />
              </Elements>
            ) : (
              <Button
                onClick={placeOrder}
                disabled={!selectedMethod}
                className={`w-full font-semibold ${
                  !selectedMethod
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                🔒 Place Order Securely
              </Button>
            )}

            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveDefault}
                onChange={(e) => setSaveDefault(e.target.checked)}
              />
              <span>Save addresses as default</span>
            </div>
          </>
        )}
      </div>
    </AnimatePresence>
  );
};

export default OrderSummery;

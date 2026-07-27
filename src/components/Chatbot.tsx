"use client";

import { useState, useRef, useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { FaTruck, FaCcVisa, FaCcMastercard } from "react-icons/fa";
import AddToCartBtnWrapper from "@/components/AddToCartWrapper";

type Message = {
  sender: string;
  type: "text" | "product" | "contact" | "orders";
  text?: string;
  product?: any[];
  contact?: any;
  orders?: any[];
};

export default function Chatbot() {
  const { currentUser } = useAppSelector((state) => state.auth);
  const { cartItems } = useSelector((state: any) => state.cart);
  const dispatch = useDispatch();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState([
    "Show products on promotion",
    "Recommend products",
    "What are the delivery times?",
    "Payment Methods",
    "Contact Us",
    "Show my recent orders",
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showBackToChat, setShowBackToChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promoRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePromoScroll = () => {
    if (!promoRef.current) return;
    setShowBackToChat(promoRef.current.scrollLeft > 10);
  };

  const scrollToChat = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
    promoRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    setShowBackToChat(false);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const sender = currentUser?.email || "Client";

    setMessages((prev) => [...prev, { sender, type: "text", text }]);
    setInput("");
    setTyping(true);

    setTimeout(async () => {
      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: sender, message: text }),
        });

        const data = await res.json();
        const newMessages: Message[] = [];

        if (data.reply) {
          newMessages.push({ sender: "EchRy", type: "text", text: data.reply });
        }

        if (data.promos && data.promos.length > 0) {
          newMessages.push({ sender: "EchRy", type: "product", product: data.promos });
        }

        if (data.contact) {
          newMessages.push({ sender: "EchRy", type: "contact", contact: data.contact });
        }

        if (data.orders && data.orders.length > 0) {
          newMessages.push({ sender: "EchRy", type: "orders", orders: data.orders });
        }

        setMessages((prev) => [...prev, ...newMessages]);

        if (data.suggestions) setSuggestions(data.suggestions);
      } catch {
        setMessages((prev) => [
          ...prev,
          { sender: "EchRy", type: "text", text: "⚠️ Assistant unavailable" },
        ]);
      }

      setTyping(false);
    }, 900);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-[9999] bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-110 transition"
      >
        <Image src="/icon.svg" alt="Chatbot Icon" width={28} height={28} className="object-contain" />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[95vw] max-w-md h-[75vh] bg-white rounded-3xl shadow-2xl flex flex-col z-[9999] overflow-hidden border">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                EchRy AI
                <span className="bg-white text-pink-500 text-xs px-2 py-0.5 rounded-full">AI</span>
              </h3>
              <span className="text-xs opacity-80">● Online</span>
            </div>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>

          {/* MESSAGES */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gray-50">
            {messages.map((m, i) => {
              const isClient = m.sender !== "EchRy";

              if (m.type === "text") {
                return (
                  <div key={i} className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-sm text-sm animate-fadeIn ${isClient ? "self-end bg-pink-100" : "self-start bg-white"}`}>
                    {m.text}
                  </div>
                );
              }

              if (m.type === "product" && m.product && m.product.length > 0) {
                return (
                  <div key={i} className="relative py-2">
                    {showBackToChat && (
                      <button
                        onClick={scrollToChat}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 text-white px-3 py-1 text-xs rounded-full shadow-lg z-10"
                      >
                        Back to chat
                      </button>
                    )}
                    <div
                      ref={promoRef}
                      onScroll={handlePromoScroll}
                      className="flex gap-3 overflow-x-auto min-w-max"
                    >
                      {m.product.map((p) => {
                        const isPayment = p.id?.startsWith("pay-");
                        const adaptedProduct = { 
                          ...p, 
                          originalId: p.originalId || p.id,
                          _id: p._id || p.id 
                        };

                        return (
                          <div key={adaptedProduct.originalId} className="w-44 flex-shrink-0 bg-gray-50 rounded-xl p-2 shadow-sm relative">
                            {p.image === "FaTruck" && <FaTruck size={40} className="text-green-600" />}
                            {p.image === "FaCcVisa" && <FaCcVisa size={40} className="text-blue-600" />}
                            {p.image === "FaCcMastercard" && <FaCcMastercard size={40} className="text-red-600" />}
                            {!isPayment && <Image src={p.image} alt={p.title} width={120} height={120} className="rounded-lg object-cover" />}
                            <p className="text-xs font-semibold mt-2 truncate">{p.title}</p>
                            {isPayment && <p className="text-[11px] text-center">{p.description}</p>}
                            {!isPayment && <AddToCartBtnWrapper product={adaptedProduct} btnStyle="style-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (m.type === "contact" && m.contact) {
                return (
                  <div key={i} className="self-start bg-white p-3 rounded-2xl shadow-sm text-sm animate-fadeIn">
                    <h4 className="font-semibold mb-1">Contact Us</h4>
                    <p>📍 {m.contact.location}</p>
                    <p>📧 {m.contact.email}</p>
                    <p>📞 {m.contact.phone}</p>
                  </div>
                );
              }

                            if (m.type === "orders" && m.orders && m.orders.length > 0) {
                return (
                  <div
                    key={i}
                    className="self-start bg-white p-3 rounded-2xl shadow-sm text-sm animate-fadeIn"
                  >
                    <h4 className="font-semibold mb-2">📦 Your Orders</h4>
                    {m.orders.map((o, idx) => (
                      <div key={idx} className="mb-2 border-b pb-2">
                        <p className="text-xs">
                          Order: <strong>{o.orderNumber}</strong>
                        </p>
                        <p className="text-xs">Status: {o.status}</p>
                        <p className="text-xs">
                          Total: ${Number(o.total).toFixed(2)}
                        </p>
                        <p className="text-xs">
                          Date: {new Date(o.date).toLocaleDateString()}
                        </p>

                        {o.items && Array.isArray(o.items) && (
                          <ul className="text-[11px] mt-1 list-disc list-inside">
                            {o.items.map((item: any, j: number) => (
                              <li key={j}>
                                {item.productName} × {item.quantity} — $
                                {Number(item.price).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* ✅ Bouton Reorder */}
                        {o.items && Array.isArray(o.items) && (
                          <button
                            onClick={() => {
                              o.items.forEach((item: any) => {
                                const adaptedProduct = {
                                  _id: item.productId,
                                  originalId: item.originalId || item.productId,
                                  title: item.productName,
                                  price: item.price,
                                  amount: item.quantity, // ✅ cohérent avec Redux
                                  image: item.image,
                                };
                                dispatch({
                                  type: "cart/addToCart",
                                  payload: adaptedProduct,
                                });
                              });
                            }}
                            className="mt-2 px-3 py-1 text-xs rounded-full bg-pink-500 text-white hover:bg-pink-600 transition"
                          >
                            🔄 Reorder (Buy again)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }

              return null;
            })}

            {typing && (
              <div className="self-start bg-white px-4 py-2 rounded-2xl shadow-sm text-sm animate-pulse">
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTIONS */}
          <div className="px-4 py-3 bg-white border-t overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (s === "Back to conversation") {
                      setSuggestions([
                        "Show products on promotion",
                        "Recommend products",
                        "What are the delivery times?",
                        "Payment Methods",
                        "Contact Us",
                        "Show my recent orders",
                      ]);
                    } else {
                      sendMessage(s);
                    }
                  }}
                  className="px-3 py-1 text-xs rounded-full bg-gray-100 hover:bg-pink-100 transition whitespace-nowrap"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT */}
          <div className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask something..."
              className="flex-1 px-4 py-2 rounded-full border focus:ring-2 focus:ring-pink-400 outline-none text-sm"
            />
            <button
              onClick={() => sendMessage(input)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 rounded-full hover:scale-105 transition"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

"use client";

import OrderSummery from "@/components/checkout/OrderSummery";
import BillingAddressForm from "@/components/forms/BillingAddressForm";
import ShippingAddressForm from "@/components/forms/ShippingAddressForm";
import { AnimatePresence, Variants, motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.1 },
  },
  exit: {
    opacity: 0,
    transition: { when: "afterChildren" },
  },
};

const btns = [
  { title: "billing" },
  { title: "shipping" },
];

const HistoryBackBtn = () => {
  const router = useRouter();
  const handleBack = () => {
    router.push("/");
  };

  return (
    <button
      onClick={handleBack}
      className="fixed left-0 top-1/2 -translate-y-1/2 flex items-center p-0.5 rounded-r-full bg-blue-100 hover:bg-blue-200 z-50 group transition-all duration-300"
      aria-label="Back to EchRy"
    >
      <ArrowLeftIcon className="w-2.5 h-2.5 text-blue-700" />
      <span className="ml-0.5 text-[10px] font-semibold text-blue-700 max-w-0 overflow-hidden group-hover:max-w-[40px] group-hover:ml-1 transition-all duration-300">
        EchRy
      </span>
    </button>
  );
};

const CheckoutPage = () => {
  const [activeForm, setActiveForm] = useState("billing");
  const [formData, setFormData] = useState<{ shipping: any; billing: any }>({
    shipping: null,
    billing: null,
  });
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const [userProfile, setUserProfile] = useState<any>(null);

  const billingFormRef = useRef<any>(null);
  const shippingFormRef = useRef<any>(null);

  // ✅ Charger le profil au montage
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();

          if (!data.name && data.email) {
            data.name = data.email.split("@")[0];
          }

          const billing = data?.billingAddress || {
            fullName: "",
            phone: "",
            streetAddress: "",
            city: "",
            state: "",
            country: "",
            postalCode: "",
          };
          const shipping = data?.shippingAddress || billing;
          setUserProfile(data);
          setFormData({ billing, shipping });

          console.log("📦 Profile loaded:", data);
        }
      } catch (error) {
        console.error("❌ Error loading profile:", error);
      }
    };
    fetchProfile();
  }, []);

  // ✅ Copier Billing vers Shipping si coché
  useEffect(() => {
    if (sameAsBilling && formData.billing) {
      setFormData((prev) => ({
        ...prev,
        shipping: { ...prev.billing },
      }));
      console.log("🔄 Shipping set same as billing:", formData.billing);
    }
  }, [sameAsBilling, formData.billing]);

  // ✅ Sauvegarde automatique à chaque changement
  const updateFormData = async (type: "shipping" | "billing", data: any) => {
    console.log(`✏️ Form update [${type}]:`, data);
    setFormData((prev) => ({
      ...prev,
      [type]: data,
    }));

    try {
      const res = await fetch("/api/user/update-address", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          billingAddress: type === "billing" ? data : formData.billing,
          shippingAddress: type === "shipping" ? data : formData.shipping,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        console.log("✅ Address auto-saved:", result);
        setUserProfile(result.user);
      } else {
        console.error("❌ Error saving address");
      }
    } catch (error) {
      console.error("❌ Error auto-saving address:", error);
    }
  };

  return (
    <div className="checkout-page relative">
      <div className="container pt-7 pb-20">
        <HistoryBackBtn />
        <div className="flex gap-7 flex-col pt-7 md:flex-row">
          <AnimatePresence mode="wait">
            <div className="left w-full md:w-3/5 bg-secondary shadow-lg py-10 px-5 rounded-lg overflow-hidden h-fit">
              <h2 className="text-2xl font-bold mb-5">Checkout</h2>

              <label className="flex items-center gap-2 mb-5">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                />
                <span>Use billing address as shipping address</span>
              </label>

              <div className="flex gap-5 mb-5">
                {btns.map((btn) => (
                  <button
                    type="button"
                    key={btn.title}
                    className={`${
                      activeForm === btn.title ? "text-white" : "text-foreground"
                    } px-5 py-2 bg-accent rounded-lg border capitalize relative`}
                    onClick={() => setActiveForm(btn.title)}
                  >
                    <span className="relative z-10">{btn.title}</span>
                    {activeForm === btn.title && (
                      <motion.span
                        layout
                        layoutId="active"
                        transition={{ type: "spring" }}
                        className="absolute top-0 left-0 w-full h-full bg-primary rounded-lg"
                      />
                    )}
                  </button>
                ))}
              </div>

              {activeForm === "billing" && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <BillingAddressForm
                    initialData={formData.billing}
                    onFormDataChange={(data) => updateFormData("billing", data)}
                    ref={billingFormRef}
                  />
                </motion.div>
              )}

              {activeForm === "shipping" && !sameAsBilling && (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <ShippingAddressForm
                    initialData={formData.shipping}
                    onFormDataChange={(data) => updateFormData("shipping", data)}
                    ref={shippingFormRef}
                  />
                </motion.div>
              )}
            </div>
          </AnimatePresence>

          <div className="right w-full bg-secondary shadow-lg rounded-lg py-10 px-5 md:w-2/5 h-fit">
            <OrderSummery
              shippingData={formData.shipping}
              billingData={formData.billing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

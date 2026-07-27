"use client";

import colors from "@/data/colors.json";
import {
  handleCartOpen,
  removeFromCart,
  clearCartByEmail,
  clearCart,
  hydrateCart,
} from "@/lib/features/cart/cartSlice";
import { useAppSelector } from "@/lib/hooks";
import { totalPrice } from "@/lib/utils";
import { AnimatePresence, Variants, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BsCartCheckFill } from "react-icons/bs";
import { HiMiniXMark } from "react-icons/hi2";
import { useDispatch } from "react-redux";
import { Button } from "./ui/button";

const ContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, when: "beforeChildren" } },
  exit: { opacity: 0, transition: { when: "afterChildren" } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, type: "tween", when: "beforeChildren", staggerChildren: 0.1 },
  },
  exit: { opacity: 0, x: "100%" },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { stiffness: 90 } },
  exit: { opacity: 0, x: "100%" },
};

const AddedCart = () => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { cartItems, isCartOpen } = useAppSelector((state) => state.cart);
  const { isAuthenticated, currentUser } = useAppSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  // ✅ Hydrate cart au montage
  useEffect(() => {
    const email = currentUser?.email;
    dispatch(hydrateCart({ email }));
  }, [currentUser?.email, dispatch]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ✅ vider le panier automatiquement après succès
  useEffect(() => {
    if (pathname.includes("/checkout/success")) {
      if (currentUser?.email) {
        dispatch(clearCartByEmail({ email: currentUser.email }));
      } else {
        dispatch(clearCart());
      }
    }
  }, [pathname, currentUser?.email, dispatch]);

  // ✅ cacher le mini-panier sur certaines pages
  const isHidden =
    pathname.includes("contact") ||
    pathname.includes("profile") ||
    pathname.includes("checkout") ||
    pathname.startsWith("/admin"); // ✅ cache sur toutes les pages admin

  const reversedItems = [...cartItems].reverse();

  const handleCheckoutClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) return;

    if (isAuthenticated) {
      router.push("/checkout");
      dispatch(handleCartOpen());
    } else {
      router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
      dispatch(handleCartOpen());
    }
  };

  // ✅ si admin → ne rien afficher
  if (isHidden) return null;

  return (
    <>
      {/* Floating cart icon */}
      <div
        className="hidden md:block fixed top-1/2 right-0 -translate-y-1/2 bg-secondary p-3 text-sm rounded-lg z-50 cursor-pointer shadow-lg border"
        onClick={() => dispatch(handleCartOpen())}
      >
        <div className="flex gap-2 items-center">
          <span className="text-xl">
            <BsCartCheckFill />
          </span>
          <span>Items {isClient ? cartItems.length : 0}</span>
        </div>

        <div className="price rounded-lg bg-primary px-2 py-1 mt-2 text-center text-white">
          <p>${isClient ? totalPrice(cartItems) : 0}</p>
        </div>
      </div>

      {/* Cart sidebar */}
      <AnimatePresence mode="wait">
        {isCartOpen && (
          <motion.div
            variants={ContainerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="card-sidebar fixed top-0 right-0 w-full h-screen z-50 flex justify-end"
          >
            <div
              className="fixed top-0 left-0 w-full h-full bg-black/40"
              onClick={() => dispatch(handleCartOpen())}
            ></div>

            <motion.div
              variants={itemVariants}
              className="w-full sm:max-w-[360px] h-full z-20 relative flex flex-col justify-between bg-secondary"
            >
              {/* Header */}
              <div className="flex border-b px-default py-3 justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    <BsCartCheckFill />
                  </span>
                  <span>Item {cartItems.length}</span>
                </div>

                <Button
                  type="button"
                  className="rounded-full h-10 w-10 p-0 text-xl hover:border-primary hover:text-primary"
                  variant="outline"
                  onClick={() => dispatch(handleCartOpen())}
                >
                  <HiMiniXMark />
                </Button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-auto pb-3">
                <ul className="px-3">
                  {isClient &&
                    reversedItems.map((c) => {
                      const colorImg = colors.find(
                        (col) => col.title.toLowerCase() === c.selectedColor?.toLowerCase()
                      );
                      return (
                        <motion.li variants={item} layout className="relative" key={c.originalId}>
                          <Button
                            type="button"
                            variant="outline"
                            className="absolute top-0 right-2 h-7 w-7 p-0 text-base rounded-full hover:text-primary hover:border-primary"
                            onClick={() =>
                              dispatch(removeFromCart({ id: c.originalId, email: currentUser?.email }))
                            }
                          >
                            <HiMiniXMark />
                          </Button>
                          <Link
                            href={`/products/${c.originalId}`}
                            className="flex gap-3 items-center mt-3 p-2 hover:bg-accent rounded-xl overflow-hidden"
                            onClick={() => dispatch(handleCartOpen())}
                          >
                            <div className="flex gap-3 w-full">
                              <Image
                                src={c.image[0] || "/placeholder.jpg"}
                                width={70}
                                height={70}
                                alt={c.title}
                                className="rounded-lg object-cover"
                              />
                              <div className="flex-1 flex justify-between gap-4 items-center">
                                <div className="h-full">
                                  <h3 className="font-semibold line-clamp-1">{c.title}</h3>
                                  <p className="mt-1 flex gap-2 items-center">
                                    <span className="text-primary">${c.price}</span>
                                    <span>*</span>
                                    <span>
                                      {c.amount} {c.unit_of_measure}
                                    </span>
                                  </p>
                                  {(c?.selectedColor || c?.selectedSize) && (
                                    <div className="flex gap-2 text-sm items-center mt-2">
                                      <p>
                                        <strong>Size: </strong>
                                        <span>{c.selectedSize}</span>
                                      </p>
                                      <p title={c?.selectedColor} className="flex gap-1 items-center">
                                        <strong>Color: </strong>
                                        <Image
                                          src={colorImg?.img || ""}
                                          alt={colorImg?.title || ""}
                                          width={20}
                                          height={20}
                                          className="rounded-full border bg-gray-600"
                                        />
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <p className="font-semibold">
                                  ${(Number(c.price) * (c?.amount || 1)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </motion.li>
                      );
                    })}
                </ul>
              </div>

              {/* Footer */}
              <div className="px-default pb-3 space-y-2">
                <Button
                  disabled={cartItems.length === 0}
                  className={`rounded-2xl pl-4 pr-1.5 w-full flex justify-between items-center py-1.5 font-semibold 
                    ${cartItems.length === 0 
                      ? "bg-gray-400 cursor-not-allowed text-gray-700" 
                      : "bg-primary text-white"}`}
                  onClick={handleCheckoutClick}
                >
                  <span>{isAuthenticated ? "Checkout" : "Login to Checkout"}</span>
                  <span className="px-3 py-2 rounded-[12px] bg-white text-black">
                    ${totalPrice(cartItems)}
                  </span>
                </Button>

                {/* ✅ Bouton Clear Cart avec email */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={cartItems.length === 0}
                  className="w-full text-red-600 border-red-600 hover:bg-red-100"
                  onClick={() => dispatch(clearCartByEmail({ email: currentUser?.email }))}
                >
                  Clear Cart
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AddedCart;

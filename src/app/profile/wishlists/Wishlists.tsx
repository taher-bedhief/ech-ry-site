"use client";

import React, { useEffect } from "react";
import WishlistCard from "@/components/cards/WishlistCard";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { AnimatePresence, Variants, motion } from "framer-motion";
import { safeGetArray, safeMap } from "@/utils/safeUtils";
import type { AllProduct } from "@/types/product";
import { hydrateWishlistFromServer } from "@/lib/features/cart/cartSlice";

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { stiffness: 90 },
  },
  exit: { opacity: 0, x: "100%" },
};

const Wishlists = () => {
  const dispatch = useAppDispatch();
  const { wishlists } = useAppSelector((state) => state.cart);
  const { currentUser } = useAppSelector((state) => state.auth);

  // ✅ Hydrate wishlist depuis MongoDB au login/refresh
  useEffect(() => {
    if (currentUser?.email) {
      dispatch(hydrateWishlistFromServer(currentUser.email));
    }
  }, [dispatch, currentUser?.email]);

  const mappedWishlists: AllProduct[] = safeGetArray<AllProduct>(wishlists).map((w) => ({
    ...w,
    _id: String(w._id),
    title: w.title || "Produit",
    price: w.price || 0,
    image: Array.isArray(w.image) ? w.image : ["/placeholder.jpg"],
    unit_of_measure: w.unit_of_measure ?? "",
    shop_category: w.shop_category ?? "",
    description: w.description || "No description",
    categories: w.categories || [],
    rating: w.rating ?? 0,
    amount: w.amount ?? 1,
    colors: (w as any).colors || [],
  }));

  return (
    <AnimatePresence>
      <div>
        {mappedWishlists.length === 0 ? (
          <motion.div
            variants={item}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-screen w-full flex justify-center items-center text-center text-2xl font-medium"
          >
            <p>No wishlist found!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
            {safeMap<AllProduct, JSX.Element>(mappedWishlists, (w) => (
              <motion.div
                key={w._id}
                layout
                variants={item}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <WishlistCard product={w} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default Wishlists;

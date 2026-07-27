"use client";

import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { AnimatePresence, Variants, motion } from "framer-motion";
import { IoIosHeartEmpty, IoMdHeart } from "react-icons/io";
import type { AllProduct } from "@/types/product";
import { toggleWishlistAsync } from "@/lib/features/cart/cartSlice";

const ContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.1, when: "beforeChildren", staggerChildren: 0.1 },
  },
  exit: { opacity: 0, transition: { when: "afterChildren" } },
};

const item: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" },
  },
  exit: { scale: 0, opacity: 0 },
};

type AddToWishlistProps = {
  product: AllProduct;
};

const AddToWishlist = ({ product }: AddToWishlistProps) => {
  const dispatch = useAppDispatch();
  const { wishlists } = useAppSelector((state) => state.cart);
  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);

  const isProductInWishlist = wishlists.some(
    (wishlist) => wishlist._id === product._id
  );

  const handleWishlistClick = async () => {
    // 🔹 toggle MongoDB + Redux
    dispatch(toggleWishlistAsync({ product, email: userEmail }));

    // 🔹 analytics tracking en parallèle
    if (userEmail) {
      try {
        await fetch("/api/analytics/product-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userEmail,
            productId: product.originalId,
            productName: product.title,
            category: product.shop_category,
            promo: product.promo,
            price: product.price,
            oldPrice: product.oldPrice,
            type: "wishlist",
            timestamp: new Date().toISOString(),
          }),
        });
        console.log("✅ Wishlist + analytics enregistrés");
      } catch (err) {
        console.error("❌ Erreur analytics:", err);
      }
    } else {
      console.warn("⚠️ Aucun email utilisateur disponible, analytics ignoré");
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={ContainerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="text-2xl rounded-full min-h-10 min-w-10 p-0 border cursor-pointer bg-accent border-primary flex justify-center items-center"
        onClick={handleWishlistClick}
      >
        {isProductInWishlist ? (
          <motion.div className="text-primary" variants={item}>
            <IoMdHeart />
          </motion.div>
        ) : (
          <motion.div variants={item}>
            <IoIosHeartEmpty />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AddToWishlist;

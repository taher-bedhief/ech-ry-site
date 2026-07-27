"use client";

import React from "react";
import CardOne from "./CardOne";
import CardTwo from "./CardTwo";
import CardThree from "./CardThree";
import CardFour from "./CardFour";
import BookCard from "./BookCard";
import { AllProduct, BooksProduct, BaseProduct } from "@/types/product";

export type ProductCardVariants =
  | "default"
  | "style-1"
  | "style-2"
  | "style-3"
  | "book-card";

type ProductCardProps = {
  variants?: ProductCardVariants;
  product: AllProduct | BaseProduct;
};

const ProductCard = ({ variants = "default", product }: ProductCardProps) => {
  // 🔎 Log général
  console.log("🃏 [ProductCard] variant:", variants);
  console.log("📦 [ProductCard] product reçu:", product);

  switch (variants) {
    case "style-1":
      console.log("🎨 [ProductCard] rendu avec CardOne");
      return <CardOne {...(product as AllProduct)} />;

    case "style-2":
      console.log("🎨 [ProductCard] rendu avec CardTwo");
      return <CardTwo {...(product as AllProduct)} />;

    case "style-3":
      console.log("🎨 [ProductCard] rendu avec CardThree");
      return <CardThree {...(product as AllProduct)} />;

    case "book-card": {
      const p = product as Partial<BooksProduct>;
      console.log("📚 [ProductCard] rendu avec BookCard, données brutes:", p);

      const bookProduct: BooksProduct = {
        _id: p._id!,
        originalId: p.originalId!,
        title: p.title!,
        description: p.description || "",
        price: p.price!,
        oldPrice: p.oldPrice ?? 0,
        promo: p.promo ?? false,
        categories: p.categories || [],
        image: p.image || ["/default.png"],
        unit_of_measure: p.unit_of_measure || "",
        shop_category: p.shop_category!,
        authors: p.authors || [],
        rating: p.rating || 0,
        amount: p.amount || 1,
        
        safeSlug: p.safeSlug || String(p._id),
        reserved: p.reserved ?? 0,
        sales: p.sales ?? 0,
      };

      console.log("📚 [ProductCard] bookProduct normalisé:", bookProduct);

      return <BookCard {...bookProduct} />;
    }

    default:
      console.log("🎨 [ProductCard] rendu avec CardFour (default)");
      return <CardFour {...(product as AllProduct)} />;
  }
};

export default ProductCard;

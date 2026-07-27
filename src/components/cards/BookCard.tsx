"use client";

import Image from "next/image";
import React, { useEffect } from "react";
import AddToCartBtnWrapper from "../AddToCartWrapper";
import Link from "next/link";
import { BooksProduct } from "@/types/product";
import { useAppSelector } from "@/lib/hooks";

const BookCard = ({
  _id,
  originalId,
  title,
  price,
  oldPrice,
  promo,
  authors,
  image,
  unit_of_measure,
  shop_category,
  description,
  categories,
  rating,
  amount,
  reserved,
  sales
}: BooksProduct) => {
  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);

  const validAuthors = Array.isArray(authors) ? authors : [];
  const validImage =
    Array.isArray(image) && image.length > 0 ? image[0] : "/default.png";
  const validCategories = Array.isArray(categories) ? categories : [];

  // 🔎 Enregistrer une "view" dès que la carte est montée
  useEffect(() => {
    if (userEmail) {
      fetch("/api/analytics/product-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userEmail,
          productId: originalId,
          productName: title,
          type: "view"
        })
      }).then(() => {
        console.log("✅ View enregistrée pour:", title);
      }).catch((err) => {
        console.error("❌ Erreur view analytics:", err);
      });
    }
  }, [userEmail, originalId, title]);

  return (
    <div className="book-card bg-secondary p-4 rounded-lg hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
      <Link href={`/products/${_id}`}>
        <div className="rounded-sm overflow-hidden">
          <Image src={validImage} width={600} height={880} alt={title} />
        </div>
        <div className="mt-3">
          <h3 className="line-clamp-1">{title}</h3>
          {validAuthors.length > 0 && (
            <p className="text-muted-foreground mt-1">
              By{" "}
              {validAuthors.map((author, index) => (
                <span key={author}>
                  {index > 0 && index === validAuthors.length - 1 && <span> and </span>}
                  {index > 0 && index < validAuthors.length - 1 && <span>, </span>}
                  {author}
                </span>
              ))}
            </p>
          )}
        </div>
      </Link>

      <div className="flex gap-2 items-center justify-between mt-1 flex-wrap">
        <p className="flex gap-2 items-end font-semibold text-lg">
          <span>${price.toFixed(2)}</span>
          {promo && oldPrice > 0 && (
            <del className="text-sm text-muted-foreground">
              ${oldPrice.toFixed(2)}
            </del>
          )}
        </p>

        <AddToCartBtnWrapper
          product={{
            _id,
            originalId,
            title,
            description: description || "",
            image: validImage ? [validImage] : [],
            price,
            oldPrice,
            promo,
            authors: validAuthors,
            categories: validCategories,
            rating: rating ?? 0,
            amount: amount ?? 1,
            reserved: reserved ?? 0,
            sales: sales ?? 0,
            unit_of_measure: unit_of_measure || "",
            shop_category,
          }}
          btnStyle="style-4"
        />
      </div>
    </div>
  );
};

export default BookCard;

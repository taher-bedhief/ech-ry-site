"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCartBtnWrapper from "../AddToCartWrapper";
import { discountPercent } from "@/lib/utils";
import { useState } from "react";
import { AllProduct } from "@/types/product";

const CardTwo = ({
  _id,
  originalId,
  title,
  image,
  price,
  unit_of_measure,
  oldPrice,
  promo,
  shop_category,
  reserved,
  sales,
}: AllProduct) => {
  const [imgError, setImgError] = useState(false);

  // 🔒 Sécurisation des champs
  const validImage =
    Array.isArray(image) && image.length > 0 ? image[0] : "/default.png";

  // ✅ valeur par défaut pour oldPrice
  const safeOldPrice = oldPrice ?? 0;

  return (
    <div className="card-two bg-secondary p-2.5 md:p-4 rounded-lg relative hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <Link
        href={`/products/${_id}`}
        className="absolute top-0 left-0 w-full h-full"
      />
      {/* discount */}
      {promo && safeOldPrice > 0 && (
        <p className="discount absolute top-3 right-3 sm:top-5 sm:right-5 text-xs px-2 py-1 rounded-md bg-green-600 text-white">
          -{discountPercent(price, safeOldPrice)}
        </p>
      )}
      <div className="img rounded-sm overflow-hidden aspect-square relative">
        {imgError ? (
          <div className="w-full h-full bg-accent flex items-center justify-center">
            <span className="text-sm text-gray-500">Image not available</span>
          </div>
        ) : (
          <Image
            src={validImage}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={title}
            className="bg-accent object-contain"
            priority={true}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="content mt-2 text-sm sm:text-base">
        <h3 className="mb-2 line-clamp-1" title={title}>
          {title}
        </h3>

        {promo && safeOldPrice > 0 && (
          <del className="font-semibold text-xs text-gray-700 dark:text-gray-300">
            ${safeOldPrice.toFixed(2)}
          </del>
        )}

        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="font-semibold">
            <span>${price.toFixed(2)}</span>{" "}
            <span className="text-[10px] align-top text-gray-700 dark:text-gray-300">
              {unit_of_measure}
            </span>
          </p>

          <AddToCartBtnWrapper
            product={{
              _id,
              originalId,
              title,
              description: "", // fallback
              image: Array.isArray(image) ? image : [validImage],
              price,
              oldPrice: safeOldPrice,
              promo,
              categories: [], // fallback
              rating: 0, // fallback
              amount: 1, // fallback
              reserved: reserved ?? 0,
              sales: sales ?? 0,
              unit_of_measure: unit_of_measure || "",
              shop_category,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CardTwo;

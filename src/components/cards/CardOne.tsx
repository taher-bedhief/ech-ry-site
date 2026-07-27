"use client";

import { discountPercent } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import AddToCartBtnWrapper from "../AddToCartWrapper";
import { AllProduct } from "@/types/product";

const CardOne = ({
  _id,
  originalId,
  title,
  price,
  image,
  oldPrice,
  promo,
  unit_of_measure,
  shop_category,
  reserved,
  sales,
}: AllProduct) => {
  // 🔒 Sécurisation des champs
  const validImage =
    Array.isArray(image) && image.length > 0 ? image[0] : "/default.png";

  // ✅ valeur par défaut pour oldPrice
  const safeOldPrice = oldPrice ?? 0;

  return (
    <div className="card-one bg-secondary p-3 md:p-4 rounded-lg relative hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
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

      <div className="img rounded-sm overflow-hidden">
        <Image
          src={validImage}
          width={500}
          height={500}
          alt={title}
          className="bg-accent"
        />

        <div className="content mt-2 font-semibold text-sm sm:text-base">
          <h2
            className="line-clamp-1 text-gray-700 dark:text-gray-300"
            title={title}
          >
            {title}
          </h2>
          <p className="mt-1 flex gap-2 items-end">
            <span className="">${price.toFixed(2)}</span>
            {promo && safeOldPrice > 0 && (
              <del className="text-sm text-gray-400">
                ${safeOldPrice.toFixed(2)}
              </del>
            )}
          </p>

          <div className="mt-3">
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
    </div>
  );
};

export default CardOne;

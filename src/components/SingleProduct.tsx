"use client";

import { EmblaOptionsType } from "embla-carousel";
import Link from "next/link";
import AddToCartBtnWrapper from "./AddToCartWrapper";
import AddToWishlist from "./AddToWishlist";
import Counter from "./Counter";
import HistoryBackBtn from "./HistoryBackBtn";
import RatingStar from "./RatingStar"; // ✅ version interactive
import ProductImageSlider from "./sliders/ProductImageSlider";
import SelectVariants from "./SelectVariants";
import { BaseProduct } from "@/types/product";
import { useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useAnalyticsEvent } from "@/lib/hooks/useAnalyticsEvent"; 

type SingleProductProps = {
  product: BaseProduct;
};

const OPTIONS: EmblaOptionsType = {};

const SingleProduct = ({ product }: SingleProductProps) => {
  const {
    _id,
    originalId,
    title,
    image = [],
    shop_category,
    categories = [],
    unit_of_measure,
    price,
    oldPrice,
    promo,
    rating = 0,   // ✅ rating dynamique depuis MongoDB
    amount = 0,
    colors = [],
    sizes = [],
    description = "",
    reserved = 0,
    sales = 0,
  } = product;

  const userEmail = useAppSelector((state) => state.auth.currentUser?.email);
  const { sendEvent } = useAnalyticsEvent(userEmail);

  // 🔎 Enregistrer une "view" dès que la page produit est ouverte
  useEffect(() => {
    if (userEmail) {
      sendEvent(product, "view");
    }
  }, [userEmail, product, sendEvent]);

  return (
    <div className="container pb-16 pt-10">
      <HistoryBackBtn />
      <div className="flex gap-10 mt-6 flex-col md:flex-row">
        {/* IMAGE SLIDER */}
        <div className="img w-full md:w-2/5 max-w-md mx-auto">
          <ProductImageSlider images={image ?? []} options={OPTIONS} />
        </div>

        {/* PRODUCT DETAILS */}
        <div className="right w-full md:w-3/5">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <AddToWishlist product={product} />
          </div>

          {/* ✅ Rating interactif */}
          <RatingStar
            productId={originalId}
            initialRating={rating ?? 0}
            className="mt-2"
          />

          <div className="flex gap-3 items-end mt-4">
            <p className="text-2xl text-primary font-semibold">
              ${price.toFixed(2)}
            </p>
            {promo && oldPrice > 0 && (
              <del className="text-gray-400 font-semibold">
                ${oldPrice.toFixed(2)}
              </del>
            )}
          </div>

          {amount > 0 && (
            <p className="mt-4 first-letter:capitalize">
              available {amount} {unit_of_measure ?? ""}
            </p>
          )}

          <p className="mt-4 text-muted-foreground">{description}</p>

          <div className="flex gap-x-4 items-center flex-wrap">
            {colors.length > 0 && (
              <div className="mt-4">
                <SelectVariants colors={colors} productId={_id} />
              </div>
            )}
            {sizes.length > 0 && (
              <div className="mt-4">
                <SelectVariants sizes={sizes} productId={_id} />
              </div>
            )}
          </div>

          <div className="flex gap-4 items-center mt-5">
            <Counter
              quantity={amount}
              product={{
                _id,
                originalId,
                title,
                image: image[0] ? [image[0]] : [],
                price,
                oldPrice,
                promo,
                unit_of_measure: unit_of_measure ?? "",
                shop_category,
                rating: rating ?? 0,
                amount: amount ?? 1,
                reserved,
                sales,
              }}
            />

            <AddToCartBtnWrapper
              btnStyle="withoutCounter"
              product={{
                _id,
                originalId,
                title,
                description: description ?? "",
                price,
                oldPrice,
                promo,
                categories: categories ?? [],
                image: image ?? [],
                unit_of_measure: unit_of_measure ?? "",
                shop_category,
                rating: rating ?? 0,
                amount: amount ?? 1,
                reserved,
                sales,
              }}
            />
          </div>

          {categories.length > 0 && (
            <p className="mt-7 flex gap-2 items-center flex-wrap whitespace-nowrap">
              <strong>Categories:</strong>
              {categories.map((item) => (
                <Link
                  href={`/shops/${shop_category}/${item}`}
                  key={item}
                  className="py-1 px-2 rounded-sm border text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-200"
                >
                  {item}
                </Link>
              ))}
            </p>
          )}

          <p className="mt-4 flex gap-2 items-center">
            <strong>Shop:</strong>
            <Link
              href={`/shops/${shop_category}`}
              className="text-muted-foreground capitalize hover:underline hover:text-primary"
            >
              {shop_category}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;

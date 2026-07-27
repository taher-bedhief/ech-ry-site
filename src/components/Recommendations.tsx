"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import AddToCartBtnWrapper from "./AddToCartWrapper";

interface Product {
  productId: string;
  title: string;
  categories?: string[];
  shop_category?: string;
  price?: number;
  oldPrice?: number;
  promo?: boolean;
  image?: string | string[];
}

export default function Recommendations({ userId }: { userId: string }) {
  const [purchaseRecs, setPurchaseRecs] = useState<Product[]>([]);
  const [interactionRecs, setInteractionRecs] = useState<Product[]>([]);

  const randomFive = (arr: Product[]) =>
    arr.sort(() => 0.5 - Math.random()).slice(0, 5);

  const fetchPurchaseRecs = useCallback(async () => {
    try {
      const res = await fetch(`/api/recommendations?userId=${userId}&type=purchase`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const mapped = data.items
          .map((item: any) => ({
            productId: item.originalId ?? item.productId,
            title: item.title ?? item.productName ?? "Untitled",
            categories: item.categories ?? [],
            shop_category: item.shop_category ?? "general",
            price: item.price ?? 0,
            oldPrice: item.oldPrice ?? 0,
            promo: item.promo ?? false,
            image: item.image,
          }))
          .filter((p: Product) => !p.promo); // ✅ exclure les produits en promo
        setPurchaseRecs(randomFive(mapped));
      }
    } catch (err) {
      console.error("❌ Error fetching purchase recommendations:", err);
    }
  }, [userId]);

  const fetchInteractionRecs = useCallback(async () => {
    try {
      const res = await fetch(`/api/recommendations?userId=${userId}&type=interaction`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const mapped = data.items
          .map((item: any) => ({
            productId: item.originalId ?? item.productId,
            title: item.title ?? item.productName ?? "Untitled",
            categories: item.categories ?? [],
            shop_category: item.shop_category ?? "general",
            price: item.price ?? 0,
            oldPrice: item.oldPrice ?? 0,
            promo: item.promo ?? false,
            image: item.image,
          }))
          .filter((p: Product) => !p.promo); // ✅ exclure les produits en promo
        setInteractionRecs(randomFive(mapped));
      }
    } catch (err) {
      console.error("❌ Error fetching interaction recommendations:", err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchPurchaseRecs();
      fetchInteractionRecs();
    }
  }, [userId, fetchPurchaseRecs, fetchInteractionRecs]);

  const renderProducts = (products: Product[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((p) => {
        const productImage = Array.isArray(p.image)
          ? p.image[0] || "/placeholder.jpg"
          : p.image || "/placeholder.jpg";

        return (
          <div
            key={p.productId}
            className="relative border rounded-lg overflow-hidden shadow-sm p-2"
          >
            <Image
              src={productImage}
              alt={p.title}
              width={200}
              height={150}
              className="object-contain w-full h-32"
            />

            <div className="mt-2 text-center">
              {/* ✅ Nom + catégorie */}
              <h3 className="text-sm font-semibold truncate">{p.title}</h3>
              <p className="text-xs text-gray-500">
                {p.categories?.[0] ?? p.shop_category}
              </p>

              {/* ✅ Prix */}
              {p.oldPrice && p.oldPrice > 0 ? (
                <div>
                  <span className="line-through text-gray-400 text-xs mr-1">
                    {p.oldPrice} €
                  </span>
                  <span className="text-red-600 font-bold text-sm">
                    {p.price ?? 0} €
                  </span>
                </div>
              ) : (
                <span className="text-black font-bold text-sm">
                  {p.price ?? 0} €
                </span>
              )}

              {/* ✅ Bouton AddToCart */}
              <div className="mt-2">
                <AddToCartBtnWrapper
                  product={{
                    _id: p.productId,
                    originalId: p.productId,
                    title: p.title,
                    description: "",
                    price: p.price ?? 0,
                    oldPrice: p.oldPrice ?? 0,
                    promo: p.promo ?? false,
                    categories: p.categories ?? [],
                    image: Array.isArray(p.image) ? p.image : p.image ? [p.image] : [],
                    rating: 0,
                    shop_category: p.shop_category ?? "general",
                    unit_of_measure: "",
                    authors: [],
                    reserved: 0,
                    sales: 0,
                  }}
                  btnStyle="style-4"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="w-full bg-gray-50 py-6">
      {/* Purchase-based */}
      <div className="flex items-center justify-between mb-3 px-4">
        <h2 className="text-lg font-semibold">Recommended Based on Purchases</h2>
        <button
          onClick={fetchPurchaseRecs}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded shadow"
        >
          🔄 Refresh
        </button>
      </div>
      {purchaseRecs.length > 0 ? (
        renderProducts(purchaseRecs)
      ) : (
        <p className="text-center text-gray-500">No purchase-based recommendations</p>
      )}

      {/* Interaction-based */}
      <div className="flex items-center justify-between mt-8 mb-3 px-4">
        <h2 className="text-lg font-semibold">Recommended Based on Interactions</h2>
        <button
          onClick={fetchInteractionRecs}
          className="text-sm px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded shadow"
        >
          🔄 Refresh
        </button>
      </div>
      {interactionRecs.length > 0 ? (
        renderProducts(interactionRecs)
      ) : (
        <p className="text-center text-gray-500">No interaction-based recommendations</p>
      )}
    </section>
  );
}

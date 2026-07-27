"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import AddToCartBtnWrapper from "../components/AddToCartWrapper";
import { AllProduct } from "@/types/product"; 

export default function PromoProducts() {
  const [products, setProducts] = useState<AllProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await fetch("/api/promoProducts");
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          setProducts([]);
        } else {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
        setError("Failed to load promotions");
      }
    };
    fetchPromo();
  }, []);

  return (
    <section className="w-full bg-gray-50 py-6">
      {error && <p className="text-center text-red-600">{error}</p>}

      {products.length === 0 && !error ? (
        <p className="text-center text-gray-500">No promotions available</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => {
            const reduction =
              p.oldPrice > 0
                ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
                : 0;

            return (
              <div
                key={p.originalId}
                className="relative border rounded-lg overflow-hidden shadow-sm p-2"
              >
                <Image
                  src={p.image?.[0] || "/placeholder.jpg"}
                  alt={p.title}
                  width={200}
                  height={150}
                  className="object-contain w-full h-32"
                />

                {p.promo && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded animate-pulse">
                    Promo
                  </div>
                )}

                <div className="mt-2 text-center">
                  <h3 className="text-sm font-semibold truncate">{p.title}</h3>
                  {p.oldPrice > 0 && (
                    <p className="line-through text-gray-400 text-xs">{p.oldPrice} €</p>
                  )}
                  <p className="text-red-500 font-bold text-sm">{p.price} €</p>

                  {reduction > 0 && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
                      -{reduction}%
                    </span>
                  )}

                  {/* ✅ Bouton AddToCart pour chaque produit */}
                  <div className="mt-2">
                    <AddToCartBtnWrapper product={p} btnStyle="style-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
